"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy } from "lucide-react"

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

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface ReachPhaseProps {
  jobId: string
  jobData?: JobData | null
  onDataChange: (data: Partial<JobData>) => void
}

export default function ReachPhase({ jobData }: ReachPhaseProps) {
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data - in real implementation, this would come from props or API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" }
  ]

  const emailTemplates: EmailTemplate[] = [
    { id: "first-outreach", name: "First-time Outreach", description: "Initial contact with a potential candidate" },
    { id: "follow-up", name: "Follow-up Message", description: "Follow up after initial contact" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule interview with interested candidate" },
    { id: "positive-feedback", name: "Positive Interview Feedback", description: "Next steps after successful interview" },
    { id: "rejection", name: "Rejection", description: "Polite rejection after interview process" }
  ]

  const handleGenerateMessage = async () => {
    if (!selectedCandidate || !selectedTemplate) {
      return
    }

    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate email message
      console.log("Generating message for:", { selectedCandidate, selectedTemplate, jobData })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock email generation based on template
      const candidate = candidates.find(c => c.id === selectedCandidate)
      const template = emailTemplates.find(t => t.id === selectedTemplate)
      
      let mockMessage = ""
      
      switch (selectedTemplate) {
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
          mockMessage = `Generated email message for ${template?.name} template...`
      }
      
      setEmailMessage(mockMessage)
    } catch (error) {
      console.error("Error generating message:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied email message to clipboard")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Email Communication</h3>
          <p className="text-sm text-muted-foreground">
            Generate personalized email messages for candidate outreach
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label>Candidate</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name} {candidate.email && `(${candidate.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select an email template" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
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

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateMessage}
              disabled={!selectedCandidate || !selectedTemplate || isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? "Generating..." : "Generate Message"}
            </Button>
          </div>

          {/* Email Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Email Message</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(emailMessage)}
                className="h-8 w-8 p-0"
                disabled={!emailMessage}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Generated email message will appear here..."
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          {emailMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This email is ready to copy and paste into your email client. 
                Remember to personalize the signature and any placeholder information before sending.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}