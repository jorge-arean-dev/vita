"use client"

import { useState, useTransition } from "react"
import { ExternalLink, MoreHorizontal, Trash2, Building2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { deleteCompany, CompanyData } from "@/app/actions/companies"

interface CompaniesViewProps {
  companies: CompanyData[]
}

export default function CompaniesView({ companies: initialCompanies }: CompaniesViewProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [isPending, startTransition] = useTransition()

  const handleOpen = (company: CompanyData) => {
    console.log("Opening company:", company)
    // TODO: Navigate to company detail page or open modal
    toast.info(`Opening ${company.name}'s profile`)
  }

  const handleDelete = (companyId: string) => {
    startTransition(async () => {
      try {
        await deleteCompany(companyId)
        setCompanies(companies.filter((company) => company.id !== companyId))
        toast.success("Company deleted successfully")
      } catch (error) {
        toast.error("Failed to delete company")
        console.error("Error deleting company:", error)
      }
    })
  }

  const getInitials = (name: string) => {
    const words = name.split(' ')
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">Manage all the companies you’re working with. Create a new one to link it to upcoming jobs</p>
          </div>
          <Button>Add Company</Button>
        </div>

        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-4">Add your first company to get started.</p>
            <Button>Add Company</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Headers */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-muted-foreground border-b">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Industry</div>
              <div className="col-span-2">Added</div>
              <div className="col-span-2"></div>
            </div>

            {/* Company Cards */}
            <div className="space-y-2">
              {companies.map((company) => {
                const location = company.country_name || company.country || "Unknown"
                const industry = company.industry_name || "Not specified"

                return (
                  <Card
                    key={company.id}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                    onClick={() => handleOpen(company)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open company: ${company.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleOpen(company)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Company Logo + Name */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-md ${getAvatarColor(company.name)} flex items-center justify-center text-white font-medium text-sm`}
                          >
                            {getInitials(company.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-primary transition-colors">
                              {company.name}
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{location}</span>
                        </div>

                        {/* Industry */}
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{industry}</span>
                        </div>

                        {/* Added Date */}
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            {new Date(company.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Links + Actions */}
                        <div className="col-span-2 flex items-center justify-center gap-3">
                          {/* Website Icon */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ExternalLink 
                                className={`h-5 w-5 cursor-pointer ${
                                  company.website ? "text-green-600" : "text-gray-400"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{company.website ? "Website Available" : "No Website"}</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* LinkedIn Icon */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-5 w-5 rounded-sm flex items-center justify-center cursor-pointer ${
                                  company.linkedin ? "bg-[#0A66C2]" : "bg-gray-400"
                                }`}
                              >
                                <span className="text-white font-bold text-[10px] leading-none">in</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{company.linkedin ? "LinkedIn Profile Available" : "No LinkedIn Profile"}</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                aria-label={`Actions for ${company.name}`}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isPending}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(company.id)
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                                disabled={isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}