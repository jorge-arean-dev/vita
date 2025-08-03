"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailBuilderProps } from './types/email-builder.types'
import { CandidateEmailsTab } from './tabs/candidate-emails-tab'
import { ClientEmailsTab } from './tabs/client-emails-tab'
import { getMockCandidates, getCandidateEmailTemplates, getClientEmailTemplates } from './utils/email-builder.utils'

export default function EmailBuilder({ jobData }: EmailBuilderProps) {
  // Mock data - in real implementation, these would come from props or API
  const candidates = getMockCandidates()
  const candidateEmailTemplates = getCandidateEmailTemplates()
  const clientEmailTemplates = getClientEmailTemplates()

  return (
    <div className="space-y-6">
      <Card className="border-none">
        <CardHeader>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Email Builder</h2>
            <p className="text-muted-foreground">Create professional outreach, follow-up, and client communication emails with AI assistance to save time and improve response rates.</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="candidate-emails" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="candidate-emails">Candidate Emails</TabsTrigger>
              <TabsTrigger value="client-emails">Client Emails</TabsTrigger>
            </TabsList>

            {/* Candidate Emails Tab */}
            <TabsContent value="candidate-emails">
              <CandidateEmailsTab
                jobData={jobData}
                candidates={candidates}
                emailTemplates={candidateEmailTemplates}
              />
            </TabsContent>

            {/* Client Emails Tab */}
            <TabsContent value="client-emails">
              <ClientEmailsTab
                jobData={jobData}
                candidates={candidates}
                emailTemplates={clientEmailTemplates}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}