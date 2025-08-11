'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { TOOL_NAME_MAPPING, BREADCRUMB_ROUTES } from '@/lib/constants/breadcrumbs'

interface JobBreadcrumbProps {
  jobId: string
  jobTitle: string
}

export function JobBreadcrumb({ jobId, jobTitle }: JobBreadcrumbProps) {
  const pathname = usePathname()
  
  // Extract tool name from pathname if present
  // Path structure: /protected/jobs/[id]/[tool-name]
  const pathSegments = pathname.split('/').filter(Boolean)
  const isToolPage = pathSegments.length > 3 && pathSegments[0] === 'protected' && pathSegments[1] === 'jobs'
  const toolSlug = isToolPage ? pathSegments[3] : null
  const toolDisplayName = toolSlug ? TOOL_NAME_MAPPING[toolSlug] : null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={BREADCRUMB_ROUTES.JOBS}>Jobs</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          {isToolPage ? (
            <BreadcrumbLink asChild>
              <Link href={BREADCRUMB_ROUTES.JOB_DETAIL(jobId)}>{jobTitle}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{jobTitle}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        
        {isToolPage && toolDisplayName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{toolDisplayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}