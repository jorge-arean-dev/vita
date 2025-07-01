'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export interface ColorValue {
  h: number
  s: number
  l: number
}

export interface ColorVariable {
  name: string
  value: ColorValue
  originalValue: ColorValue
}

interface ColorPaletteProps {
  colors: ColorVariable[]
  setColors: (colors: ColorVariable[]) => void
}

export function ColorPalette({ colors, setColors }: ColorPaletteProps) {
  const handleColorChange = (index: number, property: keyof ColorValue, value: number) => {
    const newColors = [...colors]
    newColors[index] = {
      ...newColors[index],
      value: {
        ...newColors[index].value,
        [property]: value
      }
    }
    setColors(newColors)
  }

  const applyColors = () => {
    const root = document.documentElement
    
    colors.forEach(color => {
      const { h, s, l } = color.value
      root.style.setProperty(`--${color.name}`, `${h} ${s}% ${l}%`)
    })
    
    toast.success('Colors applied to the theme')
  }

  const resetColors = () => {
    const root = document.documentElement
    
    // Create a new array with reset values
    const newColors = colors.map(color => ({
      ...color,
      value: { ...color.originalValue }
    }))
    
    // Apply the reset colors to CSS variables
    newColors.forEach(color => {
      const { h, s, l } = color.originalValue
      root.style.setProperty(`--${color.name}`, `${h} ${s}% ${l}%`)
    })
    
    // Update the state with the new colors
    setColors(newColors)
    
    toast.info('Colors reset to original values')
  }

  const copyColorConfig = () => {
    const cssVars = colors.map(color => {
      const { name, value } = color
      const { h, s, l } = value
      return `--${name}: ${h} ${s}% ${l}%;`
    }).join('\n')
    
    navigator.clipboard.writeText(cssVars)
    toast.success('CSS variables copied to clipboard')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Color Palette</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetColors}>Reset</Button>
          <Button variant="outline" onClick={copyColorConfig}>
            <Copy className="h-4 w-4 mr-2" />
            Copy CSS
          </Button>
          <Button onClick={applyColors}>Apply Colors</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colors.map((color, index) => (
          <Card key={color.name} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg capitalize">{color.name.replace(/-/g, ' ')}</CardTitle>
              <CardDescription>
                HSL: {Math.round(color.value.h)}, {Math.round(color.value.s)}%, {Math.round(color.value.l)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="h-16 rounded-md border" 
                style={{ 
                  backgroundColor: `hsl(${color.value.h} ${color.value.s}% ${color.value.l}%)`
                }}
              />
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label>Hue ({Math.round(color.value.h)})</Label>
                  </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[color.value.h]}
                    onValueChange={(value) => handleColorChange(index, 'h', value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label>Saturation ({Math.round(color.value.s)}%)</Label>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[color.value.s]}
                    onValueChange={(value) => handleColorChange(index, 's', value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label>Lightness ({Math.round(color.value.l)}%)</Label>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[color.value.l]}
                    onValueChange={(value) => handleColorChange(index, 'l', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
