import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/ui/sidebar-logged-in-user";
import Header from "@/components/ui/site-header-logged-in-user";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { unstable_noStore as noStore } from 'next/cache';

export default async function ProtectedLayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disable caching for this component to ensure fresh data on each request
  noStore();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile to get avatar_url with cache-busting
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, first_name')
    .eq('user_id', user?.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header 
          avatarUrl={profile?.avatar_url} 
          firstName={profile?.first_name} 
          userId={user?.id}
        />
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="flex-shrink-0 w-full border-t py-4 px-6 text-center text-xs flex items-center justify-center gap-4 bg-background">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </div>
  );
}
