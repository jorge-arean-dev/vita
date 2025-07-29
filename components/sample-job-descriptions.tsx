"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Trash2, Plus, Wand2, FileEdit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface JobDescription {
  id: number
  title: string
  content: string
  isExpanded: boolean
  isEditing: boolean
}

export default function JobDescriptionsPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([
    {
      id: 1,
      title: "Senior Frontend Developer",
      content:
        "We are seeking a highly skilled Senior Frontend Developer to join our dynamic team. The ideal candidate will have extensive experience with React, TypeScript, and modern web development practices. You will be responsible for building responsive, user-friendly interfaces and collaborating with our design and backend teams to deliver exceptional user experiences.",
      isExpanded: false,
      isEditing: false,
    },
    {
      id: 2,
      title: "Product Manager",
      content:
        "Join our product team as a Product Manager where you'll drive the strategy and execution of our core products. You'll work closely with engineering, design, and business stakeholders to define product requirements, prioritize features, and ensure successful product launches. The ideal candidate has 3+ years of product management experience and strong analytical skills.",
      isExpanded: false,
      isEditing: false,
    },
    {
      id: 3,
      title: "UX Designer",
      content:
        "We're looking for a creative UX Designer to help shape the user experience of our digital products. You'll conduct user research, create wireframes and prototypes, and collaborate with cross-functional teams to deliver intuitive and engaging user interfaces. Experience with Figma, user testing, and design systems is preferred.",
      isExpanded: false,
      isEditing: false,
    },
  ])

  const [nextId, setNextId] = useState(4)
  const [editingValues, setEditingValues] = useState<{ [key: number]: { title: string; content: string } }>({})

  const handleNewJobDescription = () => {
    const newJobDescription: JobDescription = {
      id: nextId,
      title: `New Job Description ${nextId}`,
      content: "Enter your job description content here...",
      isExpanded: true,
      isEditing: false,
    }
    setJobDescriptions([newJobDescription, ...jobDescriptions])
    setNextId(nextId + 1)
  }

  const handleToggleExpand = (id: number) => {
    setJobDescriptions(
      jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isExpanded: !jd.isExpanded, isEditing: false } : jd)),
    )
    // Clear editing values when collapsing
    if (editingValues[id]) {
      const newEditingValues = { ...editingValues }
      delete newEditingValues[id]
      setEditingValues(newEditingValues)
    }
  }

  const handleDelete = (id: number) => {
    setJobDescriptions(jobDescriptions.filter((jd) => jd.id !== id))
    // Clear editing values for deleted item
    if (editingValues[id]) {
      const newEditingValues = { ...editingValues }
      delete newEditingValues[id]
      setEditingValues(newEditingValues)
    }
  }

  const handleGenerate = (id: number) => {
    console.log("Generate job description for ID:", id)
    // Implement AI generation logic here
  }

  const handleEdit = (id: number) => {
    const jobDescription = jobDescriptions.find((jd) => jd.id === id)
    if (jobDescription) {
      // Store current values for editing
      setEditingValues({
        ...editingValues,
        [id]: {
          title: jobDescription.title,
          content: jobDescription.content,
        },
      })
      // Set editing mode
      setJobDescriptions(jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isEditing: true } : jd)))
    }
  }

  const handleSave = (id: number) => {
    const editingValue = editingValues[id]
    if (editingValue) {
      // Save the changes
      setJobDescriptions(
        jobDescriptions.map((jd) =>
          jd.id === id
            ? {
                ...jd,
                title: editingValue.title,
                content: editingValue.content,
                isEditing: false,
              }
            : jd,
        ),
      )
      // Clear editing values
      const newEditingValues = { ...editingValues }
      delete newEditingValues[id]
      setEditingValues(newEditingValues)
    }
  }

  const handleCancel = (id: number) => {
    // Cancel editing without saving
    setJobDescriptions(jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isEditing: false } : jd)))
    // Clear editing values
    const newEditingValues = { ...editingValues }
    delete newEditingValues[id]
    setEditingValues(newEditingValues)
  }

  const handleEditingTitleChange = (id: number, title: string) => {
    setEditingValues({
      ...editingValues,
      [id]: {
        ...editingValues[id],
        title,
      },
    })
  }

  const handleEditingContentChange = (id: number, content: string) => {
    setEditingValues({
      ...editingValues,
      [id]: {
        ...editingValues[id],
        content,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with New button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Descriptions</h1>
          <p className="text-muted-foreground">Create and manage job descriptions for your open positions</p>
        </div>
        <Button onClick={handleNewJobDescription} className="gap-2">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Job Descriptions List */}
      <div className="space-y-4">
        {jobDescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileEdit className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No job descriptions found</h3>
            <p className="text-muted-foreground mb-4">Create your first job description to get started.</p>
            <Button onClick={handleNewJobDescription} className="gap-2">
              <Plus className="h-4 w-4" />
              New Job Description
            </Button>
          </div>
        ) : (
          jobDescriptions.map((jobDescription) => (
            <Card key={jobDescription.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Collapse/Expand Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(jobDescription.id)}
                      className="h-8 w-8 p-0"
                      aria-label={jobDescription.isExpanded ? "Collapse" : "Expand"}
                    >
                      {jobDescription.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Job Title */}
                    {jobDescription.isEditing && jobDescription.isExpanded ? (
                      <Input
                        value={editingValues[jobDescription.id]?.title || jobDescription.title}
                        onChange={(e) => handleEditingTitleChange(jobDescription.id, e.target.value)}
                        className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                        placeholder="Enter job title..."
                      />
                    ) : (
                      <h3 className="text-lg font-semibold">{jobDescription.title}</h3>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!jobDescription.isExpanded ? (
                      // Collapsed view - only delete button
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(jobDescription.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Delete job description"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : jobDescription.isEditing ? (
                      // Edit Mode Buttons
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSave(jobDescription.id)}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(jobDescription.id)}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      // Expanded View Mode Buttons
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(jobDescription.id)}
                          className="gap-2"
                        >
                          <Wand2 className="h-4 w-4" />
                          Generate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(jobDescription.id)}
                          className="gap-2"
                        >
                          <FileEdit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(jobDescription.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {jobDescription.isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Text Area */}
                    <div className="space-y-2">
                      <Textarea
                        value={
                          jobDescription.isEditing
                            ? editingValues[jobDescription.id]?.content || jobDescription.content
                            : jobDescription.content
                        }
                        onChange={(e) => {
                          if (jobDescription.isEditing) {
                            handleEditingContentChange(jobDescription.id, e.target.value)
                          }
                        }}
                        className="min-h-[200px] resize-none"
                        placeholder="Enter job description content..."
                        readOnly={!jobDescription.isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
