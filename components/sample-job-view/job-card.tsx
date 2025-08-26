import type { FC } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Job } from "@/lib/types"

interface JobCardProps {
  job: Job
}

export const JobCard: FC<JobCardProps> = ({ job }) => {
  const getRateDisplay = (rate: Job["rate"]) => {
    return `$${rate.value}/${rate.basis}`
  }

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg border-border bg-card text-card-foreground shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {job.companyLogoUrl ? (
              <img
                src={job.companyLogoUrl || "/placeholder.svg"}
                alt={`${job.companyName} logo`}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{job.companyName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold">{job.companyName}</p>
            <p className="text-xs text-muted-foreground">{job.creationDate}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Save job">
          {job.isSaved ? (
            <Bookmark className="h-4 w-4 fill-primary text-primary" />
          ) : (
            <Bookmark className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 p-4 pt-2">
        <CardTitle className="text-lg font-bold">{job.jobTitle}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {job.commitment.map((c, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {c}
            </Badge>
          ))}
          <Badge variant="secondary" className="text-xs">
            {job.locationRequirement}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between border-t border-border bg-muted/30 p-3">
        <div className="flex flex-col">
          <p className="text-base font-semibold">{getRateDisplay(job.rate)}</p>
          <p className="text-xs text-muted-foreground">{job.locationDetail}</p>
        </div>
        <Button className="px-4 py-2 text-sm">Apply now</Button>
      </CardFooter>
    </Card>
  )
}
