"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Sparkles, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ClientEmailsTabProps } from '../types/email-builder.types'
import { useEmailGeneration } from '../hooks/use-email-generation'
import { getMockCandidates, getClientEmailTemplates } from '../utils/email-builder.utils'

export function ClientEmailsTab({ jobData }: ClientEmailsTabProps) {
  // Mock data - in real implementation, these would come from props or API
  const candidates = getMockCandidates()
  const clientEmailTemplates = getClientEmailTemplates()
  
  // Client Email State
  const [clientSelectedCandidate, setClientSelectedCandidate] = useState("")
  const [clientSelectedTemplate, setClientSelectedTemplate] = useState("")
  const [clientEmailMessage, setClientEmailMessage] = useState("")
  const [clientIsGenerating, setClientIsGenerating] = useState(false)
  
  const { toast } = useToast()

  // Initialize generation hooks
  const { generateClientEmail } = useEmailGeneration({
    candidates,
    candidateEmailTemplates: [], // Not needed for client emails
    clientEmailTemplates,
    jobData
  })

  const handleGenerateClientEmail = async () => {
    if (!clientSelectedCandidate || !clientSelectedTemplate) {
      return
    }

    setClientIsGenerating(true)
    try {
      const message = await generateClientEmail(clientSelectedCandidate, clientSelectedTemplate)
      setClientEmailMessage(message)
    } catch (error) {
      console.error("Error generating client email:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during generation.",
        variant: "destructive",
      })
    } finally {
      setClientIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Success",
      description: "Copied to clipboard",
    })
  }

  const handleSaveOldEmail = () => {
    const emailData = { 
      type: 'client', 
      candidate: clientSelectedCandidate, 
      template: clientSelectedTemplate, 
      message: clientEmailMessage 
    }
    
    console.log("Saving email:", emailData)
    // TODO: Implement save logic
    toast({
      title: "Success",
      description: "Email saved successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-medium">Client Communication</h3>
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
                      onClick={handleSaveOldEmail}
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
  )
}