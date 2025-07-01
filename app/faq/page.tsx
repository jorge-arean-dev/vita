import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQ() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-sans">Frequently Asked Questions</h1>
          <p className="text-muted-foreground font-mono">
            Everything you need to know about Vita - your Virtual Interface for Talent Acquisition
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-vita">
            <AccordionTrigger className="font-inter">What is Vita?</AccordionTrigger>
            <AccordionContent>
              Vita is a lightweight application designed to help recruiters streamline and speed up their workflows. 
              The app revolves around a central object: the Job, which is structured into six sections reflecting 
              the key stages of a typical recruiting process: Define, Source, Review, Reach, Assess, and Submit.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-does-vita-work">
            <AccordionTrigger className="font-sans">How does Vita work?</AccordionTrigger>
            <AccordionContent>
              Vita guides you through six key recruiting stages. Each stage includes specialized tools and AI-generated 
              outputs with copy icons for easy external use. You can move freely between stages depending on your 
              current task or workflow needs.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="what-are-six-stages">
            <AccordionTrigger className="font-sans">What are the six stages in Vita?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p><strong>1. Define:</strong> Tools to capture and organize job requirements</p>
                <p><strong>2. Source:</strong> Tools to find potential candidates</p>
                <p><strong>3. Review:</strong> Tools to evaluate candidate profiles</p>
                <p><strong>4. Reach:</strong> Tools for candidate communication</p>
                <p><strong>5. Assess:</strong> Tools for interview guidance and evaluation</p>
                <p><strong>6. Submit:</strong> Tools to present candidates to clients</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="define-stage">
            <AccordionTrigger className="font-sans">What can I do in the Define stage?</AccordionTrigger>
            <AccordionContent>
              In the Define stage, you can input client call notes or paste existing job descriptions, 
              manage company information, use AI to analyze role requirements, and automatically generate 
              complete job descriptions. Company information can be saved and reused across different jobs.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="source-stage">
            <AccordionTrigger className="font-sans">How does the Source stage help with candidate sourcing?</AccordionTrigger>
            <AccordionContent>
              The Source stage provides a Boolean Query Generator for LinkedIn that creates job-based search queries 
              ready for LinkedIn Recruiter or Sales Navigator. All generated queries come with copy icons for easy use.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="review-stage">
            <AccordionTrigger className="font-sans">What analysis tools are available in the Review stage?</AccordionTrigger>
            <AccordionContent>
              The Review stage offers LinkedIn Profile Analysis (using candidate LinkedIn URLs) and PDF Resume Analysis 
              for uploaded resumes. Both provide structured, AI-driven insights. You can save candidates for future 
              steps, and they'll be linked to the current job.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reach-stage">
            <AccordionTrigger className="font-sans">What communication tools does the Reach stage provide?</AccordionTrigger>
            <AccordionContent>
              The Reach stage includes various message templates for first-time outreach, follow-up messages, 
              interview scheduling, and interview feedback (positive, next step, or rejection). Saved candidate 
              details can be used to personalize each message, and all emails are easy to copy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assess-stage">
            <AccordionTrigger className="font-sans">How does the Assess stage help with interviews?</AccordionTrigger>
            <AccordionContent>
              The Assess stage generates tailored interview questions based on the job (suitable for both technical 
              and non-technical recruiters) and provides interview review capabilities. You can paste candidate answers 
              for AI analysis and scoring to assess performance. Interview assessments can be saved and linked to jobs.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="submit-stage">
            <AccordionTrigger className="font-sans">What does the Submit stage offer for client presentations?</AccordionTrigger>
            <AccordionContent>
              The Submit stage helps you generate customized messages that include saved candidate information 
              for clear and efficient client communications. All emails and summaries can be copied for 
              easy sharing with clients.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="job-creation">
            <AccordionTrigger className="font-sans">How do I create a new job in Vita?</AccordionTrigger>
            <AccordionContent>
              Click the job creation button to open a dialog where you'll enter the Job Name, Company, and Initial Notes. 
              After clicking "Create Job", the job page opens with a stage navigator at the top showing all six stages. 
              You can move freely between stages as needed.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="data-management">
            <AccordionTrigger className="font-sans">What data does Vita store and manage?</AccordionTrigger>
            <AccordionContent>
              Vita manages four main entities: Jobs (the central object with structured attributes), 
              Candidates (profiles with resume data, LinkedIn analysis, and interview evaluations), 
              Companies (reusable company information), and Assessments (AI-generated interview evaluations). 
              After login, you have access to Jobs, Candidates, Companies, and Settings.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="copy-feature">
            <AccordionTrigger className="font-sans">What is the copy icon feature?</AccordionTrigger>
            <AccordionContent>
              Throughout Vita, AI-generated outputs come with copy icons that allow you to easily copy content 
              for external use. This includes job descriptions, Boolean search queries, profile summaries, 
              email templates, and client communications - making it simple to use Vita's outputs in your 
              preferred external tools.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}