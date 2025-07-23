import { unstable_noStore as noStore } from "next/cache"
import { getCandidateById } from "@/app/actions/candidates"
import CandidateDetails from "@/components/candidate-details"
import { notFound } from "next/navigation"

interface CandidatePageProps {
  params: Promise<{
    candidateId: string
  }>
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  noStore() // Prevent caching for user-specific data
  
  const { candidateId } = await params
  
  try {
    const candidate = await getCandidateById(candidateId)
    
    if (!candidate) {
      notFound()
    }

    return <CandidateDetails candidate={candidate} />
  } catch (error) {
    console.error("Error loading candidate:", error)
    notFound()
  }
}