import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from 'next/cache';

export default async function CompaniesPage() {
  // Disable caching to ensure fresh user data on each request
  noStore();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Companies</h3>
        <p className="text-sm text-muted-foreground">
          Browse and manage company profiles.
        </p>
      </div>
      <div className="rounded-md bg-secondary p-8 text-center">
        <p className="text-muted-foreground">
          Company profiles will be displayed here. This section is under development.
        </p>
      </div>
    </div>
  );
}
