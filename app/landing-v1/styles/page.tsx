"use client"

import { useTypography, titleFontOptions, textFontOptions } from "@/contexts/typography-context"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, RotateCcw } from "lucide-react"

export default function StylesPage() {
  const { 
    titleFont, 
    textFont, 
    appliedTitleFont, 
    appliedTextFont, 
    setTitleFont, 
    setTextFont, 
    applyFonts, 
    resetFonts 
  } = useTypography()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/landing-v1">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Landing
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Typography Tester</h1>
          </div>
          <Button onClick={resetFonts} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Fonts
          </Button>
        </div>

        {/* Apply Button */}
        <div className="flex justify-center">
          <Button 
            onClick={applyFonts} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            disabled={titleFont.name === appliedTitleFont.name && textFont.name === appliedTextFont.name}
          >
            Apply Changes
          </Button>
        </div>

        {/* Font Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Title Font</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={titleFont.name}
                onValueChange={(value) => {
                  const font = titleFontOptions.find(f => f.name === value)
                  if (font) setTitleFont(font)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {titleFontOptions.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{font.name}</span>
                        <span className="text-xs text-gray-500">{font.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                Used for: Headers, buttons, links, and emphasis
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Font</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={textFont.name}
                onValueChange={(value) => {
                  const font = textFontOptions.find(f => f.name === value)
                  if (font) setTextFont(font)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {textFontOptions.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{font.name}</span>
                        <span className="text-xs text-gray-500">{font.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                Used for: Body text, paragraphs, descriptions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Typography Preview */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Typography Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Headers */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">Heading 1 - Main Title</h1>
                <h2 className="text-3xl font-bold">Heading 2 - Section Title</h2>
                <h3 className="text-2xl font-semibold">Heading 3 - Subsection</h3>
                <h4 className="text-xl font-semibold">Heading 4 - Card Title</h4>
              </div>

              {/* Body Text */}
              <div className="space-y-4">
                <p className="text-lg">
                  Large paragraph text - Your toolkit to manage and automate every step of the recruitment process, from job creation to candidate submission. This demonstrates how body text looks with the selected font.
                </p>
                <p className="text-base">
                  Regular paragraph text - Built for independent recruiters, boutique agencies, and niche hiring teams, Vita brings together the essential tools you need to run a smarter, faster hiring process — all in one place.
                </p>
                <p className="text-sm">
                  Small text - Whether you're recruiting in cybersecurity, pharma, automation, or beyond — Vita adapts to your workflow and grows with your business.
                </p>
              </div>

              {/* Interactive Elements */}
              <div className="flex flex-wrap gap-4 items-center">
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <div><Link href="#" className="text-blue-600 hover:underline">Sample link text</Link></div>
                <div><a href="#" className="text-gray-700 hover:text-gray-900">Navigation link</a></div>
              </div>
            </CardContent>
          </Card>

          {/* Landing Page Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Elements Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section Preview */}
              <div className="text-center space-y-4 p-6 bg-white rounded-lg border">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  <span className="font-normal">Streamline recruiting with </span>
                  <span className="font-bold">Vita</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Your AI toolkit to optimize every step of the recruitment process, from job creation to candidate submission.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg">Join Waitlist</Button>
                  <Button variant="outline" size="lg">Book a Call</Button>
                </div>
              </div>

              {/* Card Preview */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Smart Job Creation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      From writing job descriptions to building LinkedIn search strings, 
                      Vita speeds up recruitment duties.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Analyze resumes and guide interviews with intelligent insights 
                      that help you focus on making great hires.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Font Status Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Selected Fonts</span>
                {(titleFont.name !== appliedTitleFont.name || textFont.name !== appliedTextFont.name) && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Pending
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Title:</span> {titleFont.name}
                  <div className="text-sm text-gray-600">{titleFont.description}</div>
                </div>
                <div>
                  <span className="font-semibold">Text:</span> {textFont.name}
                  <div className="text-sm text-gray-600">{textFont.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Applied Fonts</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Title:</span> {appliedTitleFont.name}
                  <div className="text-sm text-gray-600">{appliedTitleFont.description}</div>
                </div>
                <div>
                  <span className="font-semibold">Text:</span> {appliedTextFont.name}
                  <div className="text-sm text-gray-600">{appliedTextFont.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}