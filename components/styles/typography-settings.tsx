'use client'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TypographySettingsProps {
  fontSizes: { [key: string]: number }
  setFontSizes: (fontSizes: { [key: string]: number }) => void
}

export function TypographySettings({ fontSizes, setFontSizes }: TypographySettingsProps) {
  const applyFontSizes = () => {
    // In a real implementation, this would update CSS variables
    // For now, we'll just show a toast
    toast.success('Font sizes applied')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Typography</h2>
        <Button onClick={applyFontSizes}>Apply Font Sizes</Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Font Sizes</CardTitle>
            <CardDescription>Adjust the base font size and scale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(fontSizes).map(([name, size]) => (
              <div key={name} className="space-y-1">
                <div className="flex justify-between">
                  <Label className="capitalize">{name === 'base' ? 'Base' : name} ({size}px)</Label>
                  <span 
                    className="text-muted-foreground"
                    style={{ fontSize: `${size}px` }}
                  >
                    Example
                  </span>
                </div>
                <Slider
                  min={8}
                  max={name.includes('xl') ? 100 : 40}
                  step={1}
                  value={[size]}
                  onValueChange={(value) => {
                    // Create a new font sizes object with the updated value
                    const newFontSizes = { ...fontSizes, [name]: value[0] }
                    setFontSizes(newFontSizes)
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Typography Preview</CardTitle>
            <CardDescription>Preview of different text styles with current settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-5xl font-bold">Heading 1</h1>
            <h2 className="text-4xl font-bold">Heading 2</h2>
            <h3 className="text-3xl font-bold">Heading 3</h3>
            <h4 className="text-2xl font-bold">Heading 4</h4>
            <h5 className="text-xl font-bold">Heading 5</h5>
            <h6 className="text-lg font-bold">Heading 6</h6>
            <p className="text-base">Base paragraph text</p>
            <p className="text-sm">Small text</p>
            <p className="text-xs">Extra small text</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
