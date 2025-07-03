import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { logInfo, logError, logAuth, logWarning } from "../logging";

export async function updateSession(request: NextRequest) {
  // Track if we're in production for Vercel-specific debugging
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  if (isProduction && isVercel) {
    logInfo('Middleware', `Processing ${request.method} ${request.nextUrl.pathname}`);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = request.cookies.getAll();
          
          // Log cookies in production for debugging
          if (isProduction && isVercel) {
            const cookieNames = allCookies.map(c => c.name);
            logInfo('Middleware', 'Cookies found', { cookies: cookieNames });
            
            // Check for critical auth cookies
            const hasAuthCookie = cookieNames.some(name => 
              name.includes('supabase') || name.includes('sb-'));
            
            if (!hasAuthCookie) {
              logWarning('Middleware', 'No Supabase auth cookies found');
            }
          }
          
          return allCookies;
        },
        setAll(cookiesToSet) {
          // Apply cookies to the request first
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          );
          
          // Create a fresh response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          
          // Apply cookies to the response with their full options
          cookiesToSet.forEach(({ name, value, options }) => {
            if (isProduction && isVercel) {
              logInfo('Middleware', `Setting cookie: ${name}`, { 
                hasOptions: !!options,
                path: options?.path,
                sameSite: options?.sameSite
              });
            }
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // Get the current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  
  // Log auth status in production
  if (isProduction && isVercel) {
    if (userError) {
      logError('Middleware', userError);
      logAuth('Session verification', undefined, false);
    } else if (user) {
      logAuth('Session verification', user.id, true);
    } else {
      logInfo('Middleware', 'No authenticated user');
    }
  }

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/about", "/faq"];
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/")
  );
  
  if (
    !isPublicRoute &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, redirect to the login page for protected routes
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    
    if (isProduction && isVercel) {
      logInfo('Middleware', `Redirecting unauthenticated user from ${request.nextUrl.pathname} to ${url.pathname}`);
    }
    
    return NextResponse.redirect(url);
  }

  // Add cache control headers for user-specific content
  if (user && !isPublicRoute) {
    supabaseResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');
    supabaseResponse.headers.set('Vary', 'Cookie, Authorization');
    
    // Add user-specific header for cache segmentation
    supabaseResponse.headers.set('X-User-ID', user.id);
    // Add timestamp to prevent any caching
    supabaseResponse.headers.set('X-Timestamp', Date.now().toString());
    
    if (isProduction && isVercel) {
      logInfo('Middleware', `Added no-cache headers for user ${user.id}`);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
