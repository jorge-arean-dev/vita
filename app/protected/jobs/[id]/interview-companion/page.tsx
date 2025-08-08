import InterviewCompanion from "@/components/interview-companion"

interface InterviewCompanionPageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewCompanionPage({ params }: InterviewCompanionPageProps) {
  const resolvedParams = await params
  
  return <InterviewCompanion jobId={resolvedParams.id} />
}