"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { EmailBuilderProps, Candidate, EmailTemplate } from './types/email-builder.types'
import { CandidateEmailsTab } from './tabs/candidate-emails-tab'
import { ClientEmailsTab } from './tabs/client-emails-tab'
import { fetchUserCandidates, fetchEmailTemplates } from '@/app/actions/email-builder'

export default function EmailBuilder({ jobData }: EmailBuilderProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateEmailTemplates, setCandidateEmailTemplates] = useState<EmailTemplate[]>([])
  const [clientEmailTemplates, setClientEmailTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch candidates and templates in parallel
        const [candidatesResult, templatesResult] = await Promise.all([
          fetchUserCandidates(),
          fetchEmailTemplates()
        ])

        if (candidatesResult.error) {
          toast({
            title: "Error",
            description: candidatesResult.error,
            variant: "destructive",
          })
        } else if (candidatesResult.data) {
          setCandidates(candidatesResult.data)
        }

        if (templatesResult.error) {
          toast({
            title: "Error",
            description: templatesResult.error,
            variant: "destructive",
          })
        } else if (templatesResult.data) {
          setCandidateEmailTemplates(templatesResult.data.candidateTemplates)
          setClientEmailTemplates(templatesResult.data.clientTemplates)
        }
      } catch (error) {
        console.error('Error loading email builder data:', error)
        toast({
          title: "Error",
          description: "Failed to load email builder data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading email builder...</p>
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}