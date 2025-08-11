"use client"

import { useState } from "react"
import { Edit, Trash2, Copy, Save, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function EmailBuilderPage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [emailTitle, setEmailTitle] = useState("React Developer - Candidate Email 4")
  const [candidateName, setCandidateName] = useState("Daniel Smith")
  const [templateName, setTemplateName] = useState("First-time Outreach (Email)")
  const [subject, setSubject] = useState("Exciting Opportunity - React Developer at Acme Tech Solutions")
  const [content, setContent] = useState(
    "Hi Daniel,\n\nI hope this message finds you well! My name is Rebecca Thompson, and I'm a Senior Recruiter at TechTalent Solutions. I came across your impressive profile and wanted to reach out about an exciting opportunity that could be a great match for your skills and experience.\n\nAcme Tech Solutions is currently seeking a talented React Developer to join their dynamic team. This is a full-time, permanent position with a competitive rate of $90 per hour, and the best part is that it's fully remote, allowing you to work from anywhere globally!\n\nIn this role, you'll be working with cutting-edge technologies, including React at an expert level, as well as Node and AWS at an advanced level. Experience in the fintech industry is essential, as you'll be contributing to innovative projects that drive the future of financial technology.\n\nAcme Tech Solutions is known for its commitment to career growth and fostering a collaborative work environment. You'll have the opportunity to work alongside some of the brightest minds in the industry, enhancing your skills and advancing your career.\n\nIf this sounds like an opportunity you'd be interested in exploring further, please reply to this email or schedule a brief chat using my calendar link: [Your Calendar Link Here].\n\nLooking forward to hearing from you!\n\nBest regards,\nRebecca Thompson\nSenior Recruiter\nTechTalent Solutions",
  )

  // State to hold original values during editing for cancel functionality
  const [originalValues, setOriginalValues] = useState({
    title: emailTitle,
    subject: subject,
    content: content,
  })

  const handleEdit = () => {
    setOriginalValues({
      title: emailTitle,
      subject: subject,
      content: content,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: "Email Saved!",
      description: "Your email changes have been successfully saved.",
    })
  }

  const handleCancel = () => {
    setEmailTitle(originalValues.title)
    setSubject(originalValues.subject)
    setContent(originalValues.content)
    setIsEditing(false)
    toast({
      title: "Changes Canceled",
      description: "Your unsaved changes have been discarded.",
      variant: "destructive",
    })
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this email?")) {
      // Implement actual delete logic here (e.g., API call)
      toast({
        title: "Email Deleted",
        description: "The email has been successfully deleted.",
        variant: "destructive",
      })
      // Optionally navigate away or clear the form
      setEmailTitle("New Email Draft")
      setSubject("")
      setContent("")
      setCandidateName("")
      setTemplateName("")
      setIsEditing(false)
    }
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied to Clipboard",
        description: "Email content has been copied.",
      })
    } catch (err) {
      console.error("Failed to copy: ", err)
      toast({
        title: "Copy Failed",
        description: "Could not copy email content to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(subject)
      toast({
        title: "Copied to Clipboard",
        description: "Email subject has been copied.",
      })
    } catch (err) {
      console.error("Failed to copy: ", err)
      toast({
        title: "Copy Failed",
        description: "Could not copy email subject to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Parent Card */}
      <Card className="w-full">
        <CardContent className="p-6 space-y-6">
          {/* Header with Title and Actions (Collapsible) */}
          <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed} className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Toggle email details">
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                {isEditing ? (
                  <Input
                    value={emailTitle}
                    onChange={(e) => setEmailTitle(e.target.value)}
                    className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Enter email title..."
                  />
                ) : (
                  <CardTitle className="text-xl font-bold">{emailTitle}</CardTitle>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSave} className="gap-2 bg-transparent">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 bg-transparent">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2 bg-transparent">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      className="gap-2 text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate */}
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Candidate</Label>
                  <p className="font-medium">{candidateName}</p>
                </div>

                {/* Template */}
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Template</Label>
                  <p className="font-medium">{templateName}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Child Card for Subject and Content */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject" className="text-sm text-muted-foreground">
                    Subject
                  </Label>
                  <Button variant="ghost" size="icon" onClick={handleCopySubject} aria-label="Copy subject">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {isEditing ? (
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                  />
                ) : (
                  <p className="font-medium">{subject}</p>
                )}
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="text-sm text-muted-foreground">
                    Content
                  </Label>
                  <Button variant="ghost" size="icon" onClick={handleCopyContent} aria-label="Copy content">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn("min-h-[300px] resize-y", !isEditing && "border-none focus-visible:ring-0")}
                  placeholder="Enter your email content here..."
                  readOnly={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
