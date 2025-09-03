"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Play } from "lucide-react"
import { simulateInterview } from "@/app/actions/interviews"

interface SimulateInterviewDialogProps {
  interviewId: string
  onSimulationComplete: () => void
}

type PerformanceLevel = 'bad' | 'mid' | 'good'

const performanceOptions: Array<{
  value: PerformanceLevel
  label: string
  description: string
}> = [
  {
    value: 'bad',
    label: 'Poor Performance',
    description: 'Candidate struggles with answers, shows uncertainty, lacks specific examples'
  },
  {
    value: 'mid',
    label: 'Average Performance', 
    description: 'Candidate provides moderate responses with some good points but lacks depth'
  },
  {
    value: 'good',
    label: 'Strong Performance',
    description: 'Candidate gives confident answers with specific examples and solid technical knowledge'
  }
]

export default function SimulateInterviewDialog({ 
  interviewId, 
  onSimulationComplete 
}: SimulateInterviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceLevel>('mid')
  const [isSimulating, setIsSimulating] = useState(false)
  const { toast } = useToast()

  const handleSimulate = async () => {
    setIsSimulating(true)
    
    try {
      const formData = new FormData()
      formData.append('interviewId', interviewId)
      formData.append('performanceLevel', selectedPerformance)
      
      const result = await simulateInterview(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: result.message || "Interview simulation completed successfully"
        })
        setOpen(false)
        onSimulationComplete()
      }
    } catch (error) {
      console.error("Error simulating interview:", error)
      toast({
        title: "Error",
        description: "Failed to simulate interview",
        variant: "destructive"
      })
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Simulate Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulate Interview</DialogTitle>
          <DialogDescription>
            Generate a 30-minute AI-powered interview transcript. Select the candidate performance level to simulate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Label className="text-sm font-medium">Performance Level</Label>
          <RadioGroup 
            value={selectedPerformance} 
            onValueChange={(value: PerformanceLevel) => setSelectedPerformance(value)}
            className="space-y-3"
          >
            {performanceOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem 
                  value={option.value} 
                  id={option.value}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={option.value}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSimulating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSimulate}
            disabled={isSimulating}
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Interview
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}