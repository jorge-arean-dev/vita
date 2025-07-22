import JobToolsGrid from "@/components/job-tools-grid"

interface JobPageProps {
  params: Promise<{ id: string }>
}

/**
 * Main job page that shows the tools grid
 * Job data and layout are handled by the layout.tsx wrapper
 */
export default async function JobPage({ params }: JobPageProps) {
  // Await the dynamic parameters
  const resolvedParams = await params

  return <JobToolsGrid jobId={resolvedParams.id} />
}