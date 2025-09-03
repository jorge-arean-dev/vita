"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { ExternalLink, MoreHorizontal, Trash2, Building2, MapPin, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { deleteCompany, CompanyData } from "@/app/actions/companies"
import CompanyDialog from "@/components/company-dialog"

interface CompaniesViewProps {
  companies: CompanyData[]
}

export default function CompaniesView({ companies: initialCompanies }: CompaniesViewProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [isPending, startTransition] = useTransition()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleOpen = (company: CompanyData) => {
    setSelectedCompanyId(company.id)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (companyId: string) => {
    startTransition(async () => {
      try {
        await deleteCompany(companyId)
        setCompanies(companies.filter((company) => company.id !== companyId))
        toast({
          title: "Success",
          description: "Company deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete company",
          variant: "destructive",
        })
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

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // Reset time to midnight for both dates to compare calendar days
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffInMs = nowOnly.getTime() - dateOnly.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Created today'
    if (diffInDays === 1) return 'Created yesterday'
    
    // Less than 2 weeks: show in days
    if (diffInDays < 14) return `Created ${diffInDays} days ago`
    
    // 2-4 weeks: show in weeks
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks <= 4) return `Created ${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    // More than 4 weeks: show in months
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `Created ${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
    
    // More than a year: show in years
    const diffInYears = Math.floor(diffInDays / 365)
    return `Created ${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
  }

  const handleCompanyCreated = () => {
    // Refresh the page to get the updated list
    window.location.reload()
  }

  const handleCompanyUpdated = () => {
    // Refresh the page to get the updated list
    window.location.reload()
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">Manage all the companies you’re working with. Create a new one to link it to upcoming jobs</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Company</Button>
        </div>

        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No companies created yet</h3>
            <p className="text-muted-foreground mb-4">Create your first company to get started.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Company</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Headers - Hidden but kept for structure */}
            <div className="sr-only">
              <div>Company Details</div>
            </div>

            {/* Company Cards - Container query wrapper */}
            <div className="@container space-y-2">
              {companies.map((company) => {
                const location = company.country_name || company.country || "Unknown"
                const industry = company.industry_name || "Not specified"

                return (
                  <Card
                    key={company.id}
                    className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 py-2"
                  >
                    <CardContent className="px-3 @[850px]:px-6 py-3 @[850px]:py-4">
                      {/* Grid layout for table-like alignment with progressive spacing */}
                      <div className="grid grid-cols-[minmax(120px,1fr)_auto] @[750px]:grid-cols-[180px_1fr_auto] @[850px]:grid-cols-[220px_1fr_auto] @[1300px]:grid-cols-[240px_1fr_auto] items-center gap-2 @[750px]:gap-3 @[850px]:gap-4">
                        {/* Company Name Column */}
                        <div className="min-w-0">
                          <span className="text-sm @[850px]:text-base font-bold group-hover:text-primary transition-colors truncate block">
                            {company.name}
                          </span>
                        </div>

                        {/* Middle Section - Progressive disclosure: Country+Industry at 750px+, Date only at 1300px+ */}
                        <div className="hidden @[750px]:grid @[750px]:grid-cols-[140px_1fr] @[850px]:grid-cols-[160px_1fr] @[1300px]:grid-cols-[160px_240px_200px] gap-4 @[850px]:gap-6 items-center">
                          {/* Country Column - Consistent width across all breakpoints */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>

                          {/* Industry Column - Expanded space when date is hidden */}
                          <div className="flex justify-start min-w-0 overflow-hidden">
                            <Badge variant="secondary" className="text-xs max-w-full">
                              <span className="truncate block">{industry}</span>
                            </Badge>
                          </div>

                          {/* Date Column - Only visible at 1300px+ for better space distribution */}
                          <div className="hidden @[1300px]:flex items-center gap-2 text-xs text-muted-foreground min-w-0 justify-end">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="whitespace-nowrap">{formatCreatedDate(company.created_at)}</span>
                          </div>
                        </div>

                        {/* Empty space on smaller containers when middle section is hidden - removed for mobile */}

                        {/* Actions Section - Always visible, responsive sizing, wider spacing below 1300px */}
                        <div className="flex items-center gap-1 @[750px]:gap-2 @[850px]:gap-3 @[1300px]:gap-2 justify-end min-w-0">
                          {/* Open Button */}
                          <Button 
                            size="sm"
                            className="px-2 @[850px]:px-3 text-xs @[850px]:text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpen(company)
                            }}
                          >
                            Open
                          </Button>

                          {/* Icon Links */}
                          <div className="hidden @[500px]:flex items-center gap-1">
                            {/* Website Icon */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={`p-2 rounded-md transition-colors hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center ${
                                    company.website ? "text-green-600" : "text-gray-400"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (company.website) window.open(company.website, '_blank')
                                  }}
                                  aria-label={company.website ? `Visit ${company.name} website` : "No website available"}
                                  disabled={!company.website}
                                  type="button"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{company.website ? "Website Available" : "No Website"}</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* LinkedIn Icon */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={`p-2 rounded-md transition-colors hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (company.linkedin) window.open(company.linkedin, '_blank')
                                  }}
                                  aria-label={company.linkedin ? `Visit ${company.name} LinkedIn profile` : "No LinkedIn profile available"}
                                  disabled={!company.linkedin}
                                  type="button"
                                >
                                  <Image
                                    src={company.linkedin ? "/linkedin-logo/linkedin-active.svg" : "/linkedin-logo/linkedin-inactive.svg"}
                                    alt="LinkedIn"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4"
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{company.linkedin ? "LinkedIn Profile Available" : "No LinkedIn Profile"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 @[850px]:h-9 @[850px]:w-9"
                                aria-label={`Actions for ${company.name}`}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isPending}
                              >
                                <MoreHorizontal className="h-3 w-3 @[850px]:h-4 @[850px]:w-4" />
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

      <CompanyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        onCompanyCreated={handleCompanyCreated}
      />

      <CompanyDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        mode="view"
        companyId={selectedCompanyId || undefined}
        onCompanyUpdated={handleCompanyUpdated}
      />
    </TooltipProvider>
  )
}