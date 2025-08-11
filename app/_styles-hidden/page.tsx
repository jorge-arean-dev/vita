'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface ColorValue {
  h: number
  s: number
  l: number
}

interface ColorVariable {
  name: string
  value: ColorValue
  originalValue: ColorValue
}

export default function StylesPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const [colors, setColors] = useState<ColorVariable[]>([])
  const [fontSizes, setFontSizes] = useState<{ [key: string]: number }>({
    base: 16,
    xs: 12,
    sm: 14,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  })
  const [borderRadius, setBorderRadius] = useState(8)

  // Extract colors from CSS variables when component mounts
  useEffect(() => {
    setMounted(true)
    extractColorsFromCSSVars()
  }, [])

  // Re-extract colors when theme changes
  useEffect(() => {
    if (mounted) {
      extractColorsFromCSSVars()
    }
  }, [theme, mounted])

  const extractColorsFromCSSVars = () => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    
    const colorVars = [
      'background', 'foreground', 'card', 'card-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
      'muted', 'muted-foreground', 'accent', 'accent-foreground',
      'destructive', 'destructive-foreground', 'border', 'ring',
      'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'
    ]

    const extractedColors = colorVars.map(name => {
      const cssVar = `--${name}`
      const value = computedStyle.getPropertyValue(cssVar).trim()
      
      // Parse HSL values (format: "H S% L%")
      const [h, s, l] = value.split(' ').map(val => {
        return parseFloat(val.replace('%', ''))
      })

      const colorValue = { h, s, l }
      
      return {
        name,
        value: { ...colorValue },
        originalValue: { ...colorValue }
      }
    })

    setColors(extractedColors)
  }

  const handleColorChange = (index: number, property: keyof ColorValue, value: number) => {
    setColors(prev => {
      const newColors = [...prev]
      newColors[index].value[property] = value
      return newColors
    })
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
    
    setColors(prev => {
      const newColors = prev.map(color => ({
        ...color,
        value: { ...color.originalValue }
      }))
      
      newColors.forEach(color => {
        const { h, s, l } = color.originalValue
        root.style.setProperty(`--${color.name}`, `${h} ${s}% ${l}%`)
      })
      
      return newColors
    })
    
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

  const applyFontSizes = () => {
    // This would typically update a CSS file or variables
    // For demo purposes, we'll just show a toast
    toast.success('Font sizes applied')
  }

  const applyBorderRadius = () => {
    const root = document.documentElement
    root.style.setProperty('--radius', `${borderRadius / 16}rem`)
    toast.success('Border radius applied')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Style Guide</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Explore and customize the application&apos;s colors, typography, and other visual styles.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing & Radius</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-4">
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
        </TabsContent>
        
        <TabsContent value="typography" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Typography</h2>
            <Button onClick={applyFontSizes}>Apply Font Sizes</Button>
          </div>
          
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
                      setFontSizes(prev => ({
                        ...prev,
                        [name]: value[0]
                      }))
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
        </TabsContent>
        
        <TabsContent value="spacing" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
