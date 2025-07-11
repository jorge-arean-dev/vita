"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy } from "lucide-react"

interface Candidate {
  id: string
  name: string
  email?: string
}


export default function ReviewPhase() {
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [analysisTypes, setAnalysisTypes] = useState({
    pdf: false,
    linkedin: false
  })
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState("")

  // Mock candidates data - in real implementation, this would come from props or API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" }
  ]

  const handleRunAnalysis = async () => {
    if (!selectedCandidate || (!analysisTypes.pdf && !analysisTypes.linkedin)) {
      return
    }

    setIsRunningAnalysis(true)
    try {
      // TODO: Implement API call to analyze candidate
      console.log("Running analysis for candidate:", selectedCandidate)
      console.log("Analysis types:", analysisTypes)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock analysis results
      const candidate = candidates.find(c => c.id === selectedCandidate)
      setAnalysisResults(`
Analysis Results for ${candidate?.name}

OVERALL MATCH: 85%

KEY STRENGTHS:
• Strong technical background in React and TypeScript
• 5+ years of frontend development experience
• Experience with modern development tools and practices
• Good communication skills based on LinkedIn profile

POTENTIAL CONCERNS:
• Limited experience with specific industry domain
• No mention of team leadership experience
• Location may require relocation discussion

RECOMMENDATION:
Strong candidate for interview. Recommend technical screening followed by culture fit assessment.

NEXT STEPS:
• Schedule initial phone screening
• Prepare technical assessment
• Review portfolio/GitHub if available
      `.trim())
    } catch (error) {
      console.error("Error running analysis:", error)
    } finally {
      setIsRunningAnalysis(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied analysis results to clipboard")
  }

  const handleSave = () => {
    console.log("Saving review data:", { selectedCandidate, analysisTypes, analysisResults })
    // TODO: Implement save logic
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Candidate Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Compare candidates against job requirements to assess fit
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label>Candidate</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate to analyze" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name} {candidate.email && `(${candidate.email})`}
                  </SelectItem>
                ))}
                <SelectItem value="create-new">+ Create New Candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Analysis Type Selection */}
          <div className="space-y-3">
            <Label>Analysis Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdf-analysis"
                  checked={analysisTypes.pdf}
                  onCheckedChange={(checked) =>
                    setAnalysisTypes(prev => ({ ...prev, pdf: checked as boolean }))
                  }
                />
                <Label htmlFor="pdf-analysis">PDF resume analysis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linkedin-analysis"
                  checked={analysisTypes.linkedin}
                  onCheckedChange={(checked) =>
                    setAnalysisTypes(prev => ({ ...prev, linkedin: checked as boolean }))
                  }
                />
                <Label htmlFor="linkedin-analysis">LinkedIn profile analysis</Label>
              </div>
            </div>
          </div>

          {/* Run Analysis Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRunAnalysis}
              disabled={!selectedCandidate || (!analysisTypes.pdf && !analysisTypes.linkedin) || isRunningAnalysis}
              className="w-full sm:w-auto"
            >
              {isRunningAnalysis ? "Running Analysis..." : "Run Analysis"}
            </Button>
          </div>

          {/* Analysis Results */}
          {analysisResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Candidate Match Analysis</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(analysisResults)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {analysisResults}
                </pre>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}