import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from 'next/cache';
import { getJobs, JobData } from "@/app/actions/jobs";
import JobsTable from "@/components/jobs-table";

export default async function JobsPage() {
  // Disable caching to ensure fresh user data on each request
  noStore();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let jobs: JobData[] = [];
  try {
    jobs = await getJobs();
  } catch {
    jobs = [];
  }

  return <JobsTable jobs={jobs} />;
}
