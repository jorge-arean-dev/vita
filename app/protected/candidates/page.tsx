import { unstable_noStore as noStore } from "next/cache"
import { getCandidates } from "@/app/actions/candidates"
import CandidatesView from "@/components/candidates-view"

export default async function CandidatesPage() {
  noStore() // Prevent caching for user-specific data
  
  const candidates = await getCandidates()

  return <CandidatesView candidates={candidates} />
}
