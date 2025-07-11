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

interface Company {
  id: string
  name: string
}

interface SubmissionTemplate {
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

interface SubmitPhaseProps {
  jobId: string
  jobData?: JobData | null
  onDataChange: (data: Partial<JobData>) => void
}

export default function SubmitPhase({ jobId, jobData, onDataChange }: SubmitPhaseProps) {
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [selectedCompany, setSelectedCompany] = useState(jobData?.companyId || "")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [submissionMessage, setSubmissionMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data - in real implementation, this would come from props or API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" }
  ]

  const companies: Company[] = [
    { id: "1", name: "TechCorp Inc." },
    { id: "2", name: "Innovation Labs" },
    { id: "3", name: "Digital Solutions Co." }
  ]

  const submissionTemplates: SubmissionTemplate[] = [
    { id: "candidate-presentation", name: "Candidate Presentation", description: "Present qualified candidate to client" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule client interview with candidate" },
    { id: "offer-negotiation", name: "Offer Negotiation", description: "Discuss compensation and terms" },
    { id: "final-submission", name: "Final Submission", description: "Submit candidate for final hiring decision" },
    { id: "follow-up", name: "Follow-up", description: "Follow up on candidate status" }
  ]

  const handleGenerateMessage = async () => {
    if (!selectedCandidate || !selectedCompany || !selectedTemplate) {
      return
    }

    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate submission message
      console.log("Generating submission message:", { selectedCandidate, selectedCompany, selectedTemplate, jobData })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock message generation based on template
      const candidate = candidates.find(c => c.id === selectedCandidate)
      const company = companies.find(c => c.id === selectedCompany)
      const template = submissionTemplates.find(t => t.id === selectedTemplate)
      
      let mockMessage = ""
      
      switch (selectedTemplate) {
        case "candidate-presentation":
          mockMessage = `Subject: Excellent ${jobData?.title || 'Software Engineer'} Candidate - ${candidate?.name}

Dear [Client Name],

I'm excited to present ${candidate?.name}, an exceptional candidate for the ${jobData?.title || 'Software Engineer'} position at ${company?.name}.

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
COMPANY: ${company?.name}

INTERVIEW LOGISTICS:
I've confirmed ${candidate?.name}'s availability for the following times:

Option 1: [Date] from [Time] to [Time]
Option 2: [Date] from [Time] to [Time]
Option 3: [Date] from [Time] to [Time]

INTERVIEW FORMAT:
Based on our discussion, I recommend a 60-90 minute interview structure:
• 15 minutes: Introduction and company overview
• 45 minutes: Technical discussion and problem-solving
• 15 minutes: Q&A and next steps

PREPARATION MATERIALS:
I've provided ${candidate?.name} with:
• Detailed job description and requirements
• Company background and culture information
• Technical focus areas for the discussion

Please confirm which time slot works best for your team, and I'll send calendar invitations to all participants.

Looking forward to facilitating a productive interview!

Best regards,
[Your Name]`
          break
          
        case "final-submission":
          mockMessage = `Subject: Final Candidate Submission - ${candidate?.name} for ${jobData?.title || 'Software Engineer'}

Dear [Client Name],

After a thorough evaluation process, I'm pleased to submit ${candidate?.name} as our top recommendation for the ${jobData?.title || 'Software Engineer'} position at ${company?.name}.

COMPREHENSIVE EVALUATION RESULTS:

Technical Competency: Exceptional
• Demonstrated expertise in required technologies
• Strong problem-solving approach in technical assessment
• Clean, maintainable code with best practices
• Experience with scalable architecture patterns

Interview Performance: Outstanding
• Clear communication and thought process
• Excellent cultural fit with your team
• Strong collaborative approach
• Genuine enthusiasm for the role and company

Reference Checks: Positive
• Former manager confirms strong performance
• Colleagues highlight leadership potential
• Consistent track record of meeting deadlines
• Positive attitude and continuous learning mindset

COMPENSATION PACKAGE:
Based on our negotiations:
• Base Salary: $[amount]
• Benefits: Standard package
• Start Date: [date] (flexible within 2-week range)

RECOMMENDATION:
${candidate?.name} represents an exceptional hire who will contribute immediately to your team's success. Their combination of technical skills, cultural fit, and growth potential makes them an ideal long-term addition.

I strongly recommend moving forward with an offer to secure this outstanding talent.

Please let me know if you need any additional information to proceed with the hiring decision.

Best regards,
[Your Name]`
          break
          
        default:
          mockMessage = `Generated submission message for ${template?.name} template...`
      }
      
      setSubmissionMessage(mockMessage)
    } catch (error) {
      console.error("Error generating message:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied submission message to clipboard")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Client Communication</h3>
          <p className="text-sm text-muted-foreground">
            Generate professional messages for presenting candidates to clients
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label>Candidate</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate to present" />
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

          {/* Company Selection */}
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select the client company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a submission template" />
              </SelectTrigger>
              <SelectContent>
                {submissionTemplates.map((template) => (
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
              disabled={!selectedCandidate || !selectedCompany || !selectedTemplate || isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? "Generating..." : "Generate Message"}
            </Button>
          </div>

          {/* Submission Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Client Message</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(submissionMessage)}
                className="h-8 w-8 p-0"
                disabled={!submissionMessage}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={submissionMessage}
              onChange={(e) => setSubmissionMessage(e.target.value)}
              placeholder="Generated client message will appear here..."
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          {submissionMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> This message is ready to send to your client. 
                Review and customize any placeholder information before sending.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}