import { unstable_noStore as noStore } from "next/cache"
import { getCompanies } from "@/app/actions/companies"
import CompaniesView from "@/components/companies-view"

export default async function CompaniesPage() {
  noStore() // Prevent caching for user-specific data
  
  const companies = await getCompanies()

  return <CompaniesView companies={companies} />
}
