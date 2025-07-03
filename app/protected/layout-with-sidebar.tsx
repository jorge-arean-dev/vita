import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/ui/sidebar-logged-in-user";
import Header from "@/components/ui/site-header-logged-in-user";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function ProtectedLayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile to get avatar_url
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, first_name')
    .eq('user_id', user?.id)
    .single();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header avatarUrl={profile?.avatar_url} firstName={profile?.first_name} />
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="w-full border-t py-4 px-6 text-center text-xs flex items-center justify-center gap-4">
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
