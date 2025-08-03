import { Email, Candidate, EmailTemplate, JobData } from '../types/email-builder.types'

// Get next counter for email title
export const getNextEmailCounter = (emails: Email[]): number => {
  const existingCounts = emails
    .map(email => {
      const match = email.title.match(/email (\d+)$/i)
      return match ? parseInt(match[1]) : 0
    })
    .filter(count => count > 0)
  
  return existingCounts.length > 0 ? Math.max(...existingCounts) + 1 : 1
}

// Create new email object
export const createNewEmail = (jobData: JobData | null | undefined): Email => {
  return {
    id: `new-${Date.now()}`,
    job_id: jobData?.id || '',
    title: `${jobData?.title || 'Job'} - Email 1`, // Will be updated with proper counter
    type: 'candidate',
    candidate_id: null,
    candidate_name: null,
    template_id: null,
    template_name: null,
    subject: "",
    content: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isExpanded: true,
    isEditing: true,
  }
}

// Mock data generators
export const getMockCandidates = (): Candidate[] => [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Mike Johnson", email: "mike@example.com" },
  { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
  { id: "5", name: "David Brown", email: "david@example.com" }
]

export const getCandidateEmailTemplates = (): EmailTemplate[] => [
  { id: "first-outreach", name: "First-time Outreach", description: "Initial contact with a potential candidate" },
  { id: "follow-up", name: "Follow-up Message", description: "Follow up after initial contact" },
  { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule interview with interested candidate" },
  { id: "positive-feedback", name: "Positive Interview Feedback", description: "Next steps after successful interview" },
  { id: "rejection", name: "Rejection", description: "Polite rejection after interview process" },
  { id: "custom-prompt", name: "✨ Custom Prompt", description: "Create your own AI generation instructions" }
]

export const getClientEmailTemplates = (): EmailTemplate[] => [
  { id: "candidate-presentation", name: "Candidate Presentation", description: "Present qualified candidate to client" },
  { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule client interview with candidate" },
  { id: "offer-negotiation", name: "Offer Negotiation", description: "Discuss compensation and terms" },
  { id: "final-submission", name: "Final Submission", description: "Submit candidate for final hiring decision" },
  { id: "follow-up", name: "Follow-up", description: "Follow up on candidate status" }
]

// Mock existing emails generator
export const getMockExistingEmails = (jobData: JobData | null | undefined): Email[] => [
  {
    id: "existing-1",
    job_id: jobData?.id || '',
    title: `${jobData?.title || 'Job'} - First Outreach to John`,
    type: 'candidate',
    candidate_id: "1",
    candidate_name: "John Doe",
    template_id: "first-outreach",
    template_name: "First-time Outreach",
    subject: `Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}`,
    content: "Hi John...",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isExpanded: false,
    isEditing: false
  }
]

// Storage key generators
export const getStorageKeys = (jobData: JobData | null | undefined) => ({
  expandedStateKey: jobData?.id ? `email-expanded-${jobData.id}` : null,
  unsavedEmailsKey: jobData?.id ? `email-unsaved-${jobData.id}` : null
})

// Generate mock email content based on template
export const generateMockEmailContent = (
  templateId: string,
  candidateId: string,
  customPrompt: string,
  candidates: Candidate[],
  emailTemplates: EmailTemplate[],
  jobData: JobData | null | undefined
): { subject: string; content: string } => {
  const candidate = candidates.find(c => c.id === candidateId)
  const template = emailTemplates.find(t => t.id === templateId)

  if (templateId === 'custom-prompt') {
    return {
      subject: `Custom Email${candidate ? ` - ${candidate.name}` : ''}`,
      content: `[AI-generated email based on custom prompt: "${customPrompt}"]

${candidate ? `Hi ${candidate.name},` : 'Hi there,'}

This email was generated using your custom prompt: "${customPrompt}"

${candidate ? `Selected candidate: ${candidate.name} (${candidate.email})` : ''}
Job: ${jobData?.title || 'Position'} at ${jobData?.companyName || 'Company'}

[Custom AI-generated content would appear here based on your specific prompt and the candidate/job context]

Best regards,
[Your Name]`
    }
  }

  switch (templateId) {
    case "first-outreach":
      return {
        subject: `Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}`,
        content: `Hi ${candidate?.name},

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
      }
      
    case "follow-up":
      return {
        subject: `Following up on ${jobData?.title || 'Software Engineer'} Opportunity`,
        content: `Hi ${candidate?.name},

I wanted to follow up on my previous message regarding the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName || 'our company'}.

I understand you might be busy, but I wanted to make sure you had a chance to consider this opportunity. The role is still available and I believe your background would be an excellent match.

If you're interested or have any questions, please don't hesitate to reach out. I'm happy to provide more details about the position, the team, or the company.

Best regards,
[Your Name]`
      }
      
    default:
      return {
        subject: `${template?.name} - ${candidate?.name}`,
        content: `Generated email for ${template?.name} template...`
      }
  }
}

// Generate mock client email content
export const generateMockClientEmailContent = (
  templateId: string,
  candidateId: string,
  candidates: Candidate[],
  clientEmailTemplates: EmailTemplate[],
  jobData: JobData | null | undefined
): string => {
  const candidate = candidates.find(c => c.id === candidateId)
  const template = clientEmailTemplates.find(t => t.id === templateId)
  
  switch (templateId) {
    case "candidate-presentation":
      return `Subject: Excellent ${jobData?.title || 'Software Engineer'} Candidate - ${candidate?.name}

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
      
    case "interview-scheduling":
      return `Subject: Interview Scheduling - ${candidate?.name} for ${jobData?.title || 'Software Engineer'} Position

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
      
    default:
      return `Generated client email for ${template?.name} template...`
  }
}