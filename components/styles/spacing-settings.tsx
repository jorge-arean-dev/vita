'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SpacingSettingsProps {
  borderRadius: number
  setBorderRadius: (radius: number) => void
}

export function SpacingSettings({ borderRadius, setBorderRadius }: SpacingSettingsProps) {
  const applyBorderRadius = () => {
    const root = document.documentElement
    root.style.setProperty('--radius', `${borderRadius / 16}rem`)
    toast.success('Border radius applied')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Border Radius</h2>
        <Button onClick={applyBorderRadius}>Apply Border Radius</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>Adjust the base border radius for components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Border Radius ({borderRadius}px)</Label>
            </div>
            <Slider
              min={0}
              max={24}
              step={1}
              value={[borderRadius]}
              onValueChange={(value) => setBorderRadius(value[0])}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="h-24 w-24 bg-primary" 
                style={{ borderRadius: `${borderRadius}px` }}
              />
              <span className="text-sm text-muted-foreground">Base</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="h-24 w-24 bg-secondary" 
                style={{ borderRadius: `${borderRadius - 2}px` }}
              />
              <span className="text-sm text-muted-foreground">Medium</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="h-24 w-24 bg-accent" 
                style={{ borderRadius: `${borderRadius - 4}px` }}
              />
              <span className="text-sm text-muted-foreground">Small</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
