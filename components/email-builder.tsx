"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Sparkles, Save } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface Candidate {
  id: string
  name: string
  email?: string
}


interface EmailTemplate {
  id: string
  name: string
  description: string
}

interface EmailBuilderProps {
  jobId: string
  jobData?: JobData | null
}

export default function EmailBuilder({ jobId, jobData }: EmailBuilderProps) {
  const router = useRouter()
  
  // Candidate Email State
  const [candidateSelectedCandidate, setCandidateSelectedCandidate] = useState("")
  const [candidateSelectedTemplate, setCandidateSelectedTemplate] = useState("")
  const [candidateEmailMessage, setCandidateEmailMessage] = useState("")
  const [candidateIsGenerating, setCandidateIsGenerating] = useState(false)
  
  // Client Email State
  const [clientSelectedCandidate, setClientSelectedCandidate] = useState("")
  const [clientSelectedTemplate, setClientSelectedTemplate] = useState("")
  const [clientEmailMessage, setClientEmailMessage] = useState("")
  const [clientIsGenerating, setClientIsGenerating] = useState(false)

  // Mock data - in real implementation, this would come from API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" },
    { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
    { id: "5", name: "David Brown", email: "david@example.com" }
  ]

  const candidateEmailTemplates: EmailTemplate[] = [
    { id: "first-outreach", name: "First-time Outreach", description: "Initial contact with a potential candidate" },
    { id: "follow-up", name: "Follow-up Message", description: "Follow up after initial contact" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule interview with interested candidate" },
    { id: "positive-feedback", name: "Positive Interview Feedback", description: "Next steps after successful interview" },
    { id: "rejection", name: "Rejection", description: "Polite rejection after interview process" }
  ]

  const clientEmailTemplates: EmailTemplate[] = [
    { id: "candidate-presentation", name: "Candidate Presentation", description: "Present qualified candidate to client" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule client interview with candidate" },
    { id: "offer-negotiation", name: "Offer Negotiation", description: "Discuss compensation and terms" },
    { id: "final-submission", name: "Final Submission", description: "Submit candidate for final hiring decision" },
    { id: "follow-up", name: "Follow-up", description: "Follow up on candidate status" }
  ]


  const handleGenerateCandidateEmail = async () => {
    if (!candidateSelectedCandidate || !candidateSelectedTemplate) {
      return
    }

    setCandidateIsGenerating(true)
    try {
      // TODO: Implement API call to generate candidate email
      console.log("Generating candidate email:", { candidateSelectedCandidate, candidateSelectedTemplate, jobData })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const candidate = candidates.find(c => c.id === candidateSelectedCandidate)
      const template = candidateEmailTemplates.find(t => t.id === candidateSelectedTemplate)
      
      let mockMessage = ""
      
      switch (candidateSelectedTemplate) {
        case "first-outreach":
          mockMessage = `Subject: Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}

Hi ${candidate?.name},

I hope this message finds you well. I came across your profile and was impressed by your background in software development.

We have an exciting ${jobData?.title || 'Software Engineer'} position available at ${jobData?.companyName || 'our company'} that I believe would be a great fit for your skills and experience.

The role offers:
• Competitive compensation package
• Flexible working arrangements
• Growth opportunities in a dynamic team
• Cutting-edge technology stack

Would you be interested in learning more about this opportunity? I'd love to schedule a brief call to discuss the details and answer any questions you might have.

Looking forward to hearing from you!

Best regards,
[Your Name]`
          break
          
        case "follow-up":
          mockMessage = `Subject: Following up on ${jobData?.title || 'Software Engineer'} Opportunity

Hi ${candidate?.name},

I wanted to follow up on my previous message regarding the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName || 'our company'}.

I understand you might be busy, but I wanted to make sure you had a chance to consider this opportunity. The role is still available and I believe your background would be an excellent match.

If you're interested or have any questions, please don't hesitate to reach out. I'm happy to provide more details about the position, the team, or the company.

Best regards,
[Your Name]`
          break
          
        case "interview-scheduling":
          mockMessage = `Subject: Interview Scheduling - ${jobData?.title || 'Software Engineer'} Position

Hi ${candidate?.name},

Thank you for your interest in the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName || 'our company'}! We're excited to move forward with the interview process.

I'd like to schedule a 45-minute video interview with our hiring team. Please let me know your availability for the following times:

• [Date] at [Time]
• [Date] at [Time]  
• [Date] at [Time]

The interview will cover your technical background, experience, and how you might fit with our team. We'll also be happy to answer any questions you have about the role or company.

Please confirm which time works best for you, and I'll send a calendar invitation with the video call details.

Looking forward to our conversation!

Best regards,
[Your Name]`
          break
          
        default:
          mockMessage = `Generated candidate email for ${template?.name} template...`
      }
      
      setCandidateEmailMessage(mockMessage)
    } catch (error) {
      console.error("Error generating candidate email:", error)
    } finally {
      setCandidateIsGenerating(false)
    }
  }

  const handleGenerateClientEmail = async () => {
    if (!clientSelectedCandidate || !clientSelectedTemplate) {
      return
    }

    setClientIsGenerating(true)
    try {
      // TODO: Implement API call to generate client email
      console.log("Generating client email:", { clientSelectedCandidate, clientSelectedTemplate, jobData })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const candidate = candidates.find(c => c.id === clientSelectedCandidate)
      const template = clientEmailTemplates.find(t => t.id === clientSelectedTemplate)
      
      let mockMessage = ""
      
      switch (clientSelectedTemplate) {
        case "candidate-presentation":
          mockMessage = `Subject: Excellent ${jobData?.title || 'Software Engineer'} Candidate - ${candidate?.name}

Dear [Client Name],

I'm excited to present ${candidate?.name}, an exceptional candidate for the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName}.

CANDIDATE OVERVIEW:
${candidate?.name} brings strong technical expertise and proven experience that aligns perfectly with your requirements. Based on our comprehensive evaluation, they demonstrate:

• 5+ years of experience in frontend development with React and TypeScript
• Strong problem-solving skills and attention to detail
• Excellent communication and collaboration abilities
• Proven track record of delivering high-quality software solutions
• Cultural fit with your team's values and working style

KEY HIGHLIGHTS:
• Successfully led frontend development for 3 major product launches
• Experience with modern development practices including CI/CD and testing
• Strong background in performance optimization and scalability
• Available to start within 2-3 weeks notice period

EVALUATION SUMMARY:
• Technical Assessment: Excellent (4.5/5)
• Communication Skills: Strong (4/5)
• Cultural Fit: Excellent (4.5/5)
• Overall Rating: Highly Recommended

COMPENSATION EXPECTATIONS:
[Salary range based on candidate discussion]

NEXT STEPS:
I recommend scheduling an interview at your earliest convenience. ${candidate?.name} is actively interviewing with other companies, so I suggest moving quickly to secure this exceptional talent.

Please let me know your availability for an interview, and I'll coordinate the scheduling.

Best regards,
[Your Name]`
          break
          
        case "interview-scheduling":
          mockMessage = `Subject: Interview Scheduling - ${candidate?.name} for ${jobData?.title || 'Software Engineer'} Position

Dear [Client Name],

Following your positive feedback on ${candidate?.name}'s profile, I'd like to coordinate the interview process.

CANDIDATE: ${candidate?.name}
POSITION: ${jobData?.title || 'Software Engineer'}
COMPANY: ${jobData?.companyName}

INTERVIEW LOGISTICS:
I've confirmed ${candidate?.name}'s availability for the following times:

Option 1: [Date] from [Time] to [Time]
Option 2: [Date] from [Time] to [Time]
Option 3: [Date] from [Time] to [Time]

INTERVIEW FORMAT:
I recommend a 60-minute video interview covering:
• Technical background and experience (20 mins)
• Problem-solving and case studies (20 mins)
• Cultural fit and team dynamics (15 mins)
• Q&A and next steps (5 mins)

Please confirm your preferred time slot, and I'll send calendar invitations to all participants.

Best regards,
[Your Name]`
          break
          
        default:
          mockMessage = `Generated client email for ${template?.name} template...`
      }
      
      setClientEmailMessage(mockMessage)
    } catch (error) {
      console.error("Error generating client email:", error)
    } finally {
      setClientIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied to clipboard")
  }

  const handleSave = (emailType: 'candidate' | 'client') => {
    const emailData = emailType === 'candidate' 
      ? { type: 'candidate', candidate: candidateSelectedCandidate, template: candidateSelectedTemplate, message: candidateEmailMessage }
      : { type: 'client', candidate: clientSelectedCandidate, template: clientSelectedTemplate, message: clientEmailMessage }
    
    console.log("Saving email:", emailData)
    // TODO: Implement save logic
  }

  return (
    <div className="space-y-6">
        <Card>
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
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Candidate Outreach</h3>
                <p className="text-sm text-muted-foreground">
                  Generate professional emails for candidate outreach and communication
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Candidate Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Candidate</Label>
                    <Select value={candidateSelectedCandidate} onValueChange={setCandidateSelectedCandidate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                            {candidate.email && (
                              <span className="text-muted-foreground"> ({candidate.email})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select value={candidateSelectedTemplate} onValueChange={setCandidateSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidateEmailTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">{template.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateCandidateEmail}
                  disabled={!candidateSelectedCandidate || !candidateSelectedTemplate || candidateIsGenerating}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {candidateIsGenerating ? "Generating Email..." : "Generate Candidate Email"}
                </Button>

                {/* Generated Email */}
                {(candidateEmailMessage || candidateIsGenerating) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Email</Label>
                      <div className="flex gap-2">
                        {candidateEmailMessage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(candidateEmailMessage)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave('candidate')}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={candidateIsGenerating ? "Generating personalized email..." : candidateEmailMessage}
                      onChange={(e) => setCandidateEmailMessage(e.target.value)}
                      rows={16}
                      className="min-h-[300px] font-mono text-sm"
                      disabled={candidateIsGenerating}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Emails Tab */}
          <TabsContent value="client-emails">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Client Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Generate professional emails for client communication and candidate submissions
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Email Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Candidate</Label>
                    <Select value={clientSelectedCandidate} onValueChange={setClientSelectedCandidate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                            {candidate.email && (
                              <span className="text-muted-foreground"> ({candidate.email})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select value={clientSelectedTemplate} onValueChange={setClientSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientEmailTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">{template.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateClientEmail}
                  disabled={!clientSelectedCandidate || !clientSelectedTemplate || clientIsGenerating}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {clientIsGenerating ? "Generating Email..." : "Generate Client Email"}
                </Button>

                {/* Generated Email */}
                {(clientEmailMessage || clientIsGenerating) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Email</Label>
                      <div className="flex gap-2">
                        {clientEmailMessage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(clientEmailMessage)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave('client')}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={clientIsGenerating ? "Generating personalized email..." : clientEmailMessage}
                      onChange={(e) => setClientEmailMessage(e.target.value)}
                      rows={16}
                      className="min-h-[300px] font-mono text-sm"
                      disabled={clientIsGenerating}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </CardContent>
        </Card>
    </div>
  )
}