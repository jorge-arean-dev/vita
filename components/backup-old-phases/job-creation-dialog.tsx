"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { jobCreationSchema, type JobCreationFormData } from "@/lib/validations/job"
import { createJob } from "@/app/actions/job-management"

/**
 * Job creation dialog component that captures initial job information.
 * 
 * This modal dialog provides a streamlined interface for creating new jobs,
 * collecting the minimum required information before launching the full
 * job editor interface. The dialog focuses on essential data:
 * - Job title (required)
 * - Company association (with option to create new)
 * - Initial notes/requirements
 * 
 * Upon successful creation, users are redirected to the job editor
 * starting with the Define phase.
 */

/**
 * Company data structure for the company selection dropdown
 */
interface Company {
  id: string
  name: string
}

/**
 * Props for the JobCreationDialog component
 */
interface JobCreationDialogProps {
  companies?: Company[]          // Available companies for selection
  children: React.ReactNode      // Trigger element (usually a button)
}

export default function JobCreationDialog({ companies = [], children }: JobCreationDialogProps) {
  // Dialog state management
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  
  // Form state management with Zod validation
  const form = useForm<JobCreationFormData>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues: {
      title: "",
      companyId: "",
      initialNotes: ""
    }
  })

  /**
   * Handle form submission for job creation
   * Uses server action for validated job creation
   */
  const handleSubmit = async (data: JobCreationFormData) => {
    setIsLoading(true)

    try {
      // Call server action for job creation
      const result = await createJob(data)
      
      if (result.success) {
        setOpen(false)
        form.reset() // Reset form after successful submission
        
        // Navigate to job editor with actual job ID
        router.push(`/protected/jobs/${result.jobId}?phase=define&tab=initial-data`)
      } else {
        // Handle server-side errors
        form.setError("root", {
          type: "manual",
          message: result.error || "Failed to create job. Please try again."
        })
      }
    } catch (error) {
      console.error("Error creating job:", error)
      form.setError("root", {
        type: "manual",
        message: "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter job title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new">+ Create New Company</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter client call notes, job description, or any initial information about the role"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}