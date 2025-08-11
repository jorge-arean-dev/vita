'use client'

import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BREADCRUMB_ROUTES } from '@/lib/constants/breadcrumbs'

interface CandidateBreadcrumbProps {
  candidateName: string
}

export function CandidateBreadcrumb({ candidateName }: CandidateBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={BREADCRUMB_ROUTES.CANDIDATES}>Candidates</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbPage>{candidateName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}