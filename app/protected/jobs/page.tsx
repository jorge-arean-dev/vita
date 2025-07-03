import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Jobs</h3>
        <p className="text-sm text-muted-foreground">
          Manage and browse job listings.
        </p>
      </div>
      <div className="rounded-md bg-secondary p-8 text-center">
        <p className="text-muted-foreground">
          Job listings will be displayed here. This section is under development.
        </p>
      </div>
    </div>
  );
}
