import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Simplified middleware for waitlist version
  // Only allow specific routes needed for the landing page and waitlist functionality
  
  const { pathname } = request.nextUrl;
  
  // Allow only these routes:
  // - Root route (landing page)
  // - API routes for waitlist
  // - Static files
  const allowedRoutes = [
    "/",
    "/api/waitlist",
    "/actions/waitlist",
  ];
  
  const isAllowedRoute = allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Allow static files and Next.js internals
  const isStaticFile = pathname.startsWith("/_next") || 
                      pathname.includes(".") || 
                      pathname === "/favicon.ico";
  
  if (!isAllowedRoute && !isStaticFile) {
    // Redirect all other routes to root (landing page)
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
