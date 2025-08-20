"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import type { LinkedInProfile } from "@/types/linkedin.types"

// Local imports
import type { CreateTalentDialogProps, InputMethod, DataSource, Step } from "./types"
import { useCandidateForm } from "./hooks/useCandidateForm"
import { useResumeProcessor } from "./hooks/useResumeProcessor"
import { useLinkedInProcessor } from "./hooks/useLinkedInProcessor"
import { DataSourceStep } from "./components/DataSourceStep"
import { PersonalInfoStep } from "./components/PersonalInfoStep"
import { SkillsStep } from "./components/SkillsStep"
import { StepProgress } from "./components/StepProgress"
import { validateFile, canProceedToNext } from "./utils/validation"

export default function CreateTalentDialog({ 
  open, 
  onOpenChange, 
  onCandidateCreated 
}: CreateTalentDialogProps) {
  const { toast } = useToast()
  
  // Form hook
  const {
    formData,
    setFormData,
    parsedSkills,
    setParsedSkills,
    tempFilePath,
    setTempFilePath,
    isDirty,
    setIsDirty,
    isPending,
    countries,
    countrySearchValue,
    setCountrySearchValue,
    handleSearchCountries,
    handleCountrySelect,
    handleSubmit,
    resetForm,
    updateFormWithCountry,
    cleanupTempFile
  } = useCandidateForm()
  
  // API processing hooks
  const resumeProcessor = useResumeProcessor()
  const linkedInProcessor = useLinkedInProcessor()
  
  // State management
  const [currentStep, setCurrentStep] = useState<Step>("data-source")
  const [inputMethod, setInputMethod] = useState<InputMethod>("auto")
  const [dataSource, setDataSource] = useState<DataSource>("linkedin")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUploadError, setFileUploadError] = useState("")
  const [isCountriesOpen, setIsCountriesOpen] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  
  // Raw data state for enhanced match analysis
  const [rawLinkedInProfile, setRawLinkedInProfile] = useState<LinkedInProfile | null>(null)
  const [rawResumeText, setRawResumeText] = useState<string>("")
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("")

  // Reset dialog state when closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Check if there are unsaved changes
      if (isDirty) {
        setShowUnsavedChangesDialog(true)
        return
      }
      resetDialogState()
    }
    onOpenChange(newOpen)
  }

  // Reset dialog state
  const resetDialogState = async () => {
    // Clean up temporary file if it exists
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath)
    }
    
    setCurrentStep("data-source")
    setInputMethod("auto")
    setDataSource("linkedin")
    setLinkedinUrl("")
    setUploadedFile(null)
    setFileUploadError("")
    setIsCountriesOpen(false)
    setRawLinkedInProfile(null)
    setRawResumeText("")
    setUploadedFileUrl("")
    resetForm()
  }

  // Confirm close with unsaved changes
  const handleConfirmClose = async () => {
    setShowUnsavedChangesDialog(false)
    await resetDialogState()
    onOpenChange(false)
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setFileUploadError("")
    
    if (file) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setFileUploadError(validation.error!)
        setUploadedFile(null)
        return
      }
    }
    
    setUploadedFile(file)
  }

  // Process data source (API call)
  const handleProcessDataSource = async () => {
    if (dataSource === "linkedin" && !linkedinUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a LinkedIn URL",
        variant: "destructive",
      })
      return
    }
    
    if (dataSource === "pdf" && !uploadedFile) {
      toast({
        title: "Error", 
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    if (dataSource === "pdf" && uploadedFile) {
      const result = await resumeProcessor.processResume(uploadedFile)
      if (result.success && result.formData) {
        setFormData(prev => ({ ...prev, ...result.formData }))
        if (result.skills) setParsedSkills(result.skills)
        if (result.tempFilePath) setTempFilePath(result.tempFilePath)
        if (result.tempFileUrl) setUploadedFileUrl(result.tempFileUrl) // Store temp file URL
        if (result.rawResumeText) setRawResumeText(result.rawResumeText) // Store raw resume text
        if (result.formData.country) {
          await updateFormWithCountry(result.formData.country)
        }
        setIsDirty(true)
        setCurrentStep("personal-info")
      }
    } else {
      const result = await linkedInProcessor.processLinkedIn(linkedinUrl)
      if (result.success && result.formData) {
        setFormData(prev => ({ ...prev, ...result.formData }))
        if (result.skills) setParsedSkills(result.skills)
        if (result.rawLinkedInProfile) setRawLinkedInProfile(result.rawLinkedInProfile) // Store raw LinkedIn profile
        if (result.formData.country) {
          await updateFormWithCountry(result.formData.country)
        }
        setIsDirty(true)
        setCurrentStep("personal-info")
      }
    }
  }

  // Handle form data changes
  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setIsDirty(true)
  }

  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case "data-source":
        return "Create Candidate"
      case "personal-info":
        return "Step 1: Personal Information"
      case "skills":
        return "Step 2: Candidate Skills"
      default:
        return "Create Candidate"
    }
  }
  
  // Get current numeric step for progress indicator
  const getCurrentStepNumber = (): 1 | 2 => {
    return currentStep === "skills" ? 2 : 1
  }
  
  // Check if we should show progress indicator (global position)
  const shouldShowProgress = () => {
    return currentStep === "personal-info" || 
           currentStep === "skills"
  }

  // Check if we can proceed
  const canProceed = canProceedToNext(
    inputMethod,
    currentStep,
    dataSource,
    linkedinUrl,
    uploadedFile,
    formData
  )

  // Determine if we're in a processing state
  const isProcessing = resumeProcessor.isProcessing || linkedInProcessor.isProcessing

  // Determine if we should show the review banner (for automatic upload after parsing)
  const shouldShowReviewBanner = () => {
    return inputMethod === "auto" && (parsedSkills.length > 0 || formData.firstName.trim() !== "")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          {/* Progress Indicator */}
          {shouldShowProgress() && (
            <StepProgress 
              currentStep={getCurrentStepNumber()}
              steps={[
                { number: 1, title: "Personal Information" },
                { number: 2, title: "Candidate Skills" }
              ]}
            />
          )}
          
          <div className="space-y-6">
            {/* Data Source Step */}
            {currentStep === "data-source" && (
              <DataSourceStep
                inputMethod={inputMethod}
                onInputMethodChange={setInputMethod}
                dataSource={dataSource}
                onDataSourceChange={setDataSource}
                linkedinUrl={linkedinUrl}
                onLinkedinUrlChange={setLinkedinUrl}
                uploadedFile={uploadedFile}
                onFileUpload={handleFileUpload}
                fileUploadError={fileUploadError}
                isProcessing={isProcessing}
                uploadProgress={resumeProcessor.uploadProgress}
                parsingProgress={resumeProcessor.parsingProgress}
                linkedinProgress={linkedInProcessor.linkedinProgress}
                // Props for manual input
                formData={formData}
                onFormDataChange={handleFormDataChange}
                countries={countries}
                countrySearchValue={countrySearchValue}
                onCountrySearchChange={setCountrySearchValue}
                onCountrySearch={handleSearchCountries}
                onCountrySelect={handleCountrySelect}
                isComboOpen={isCountriesOpen}
                setIsComboOpen={setIsCountriesOpen}
                // Progress bar props
                showProgressBar={inputMethod === "manual"}
                currentStepNumber={getCurrentStepNumber()}
              />
            )}

            {/* Personal Info Step */}
            {currentStep === "personal-info" && (
              <PersonalInfoStep
                formData={formData}
                onChange={handleFormDataChange}
                countries={countries}
                countrySearchValue={countrySearchValue}
                onCountrySearchChange={setCountrySearchValue}
                onCountrySearch={handleSearchCountries}
                onCountrySelect={handleCountrySelect}
                isComboOpen={isCountriesOpen}
                setIsComboOpen={setIsCountriesOpen}
                showReviewBanner={shouldShowReviewBanner()}
              />
            )}
            
            {/* Skills Step */}
            {currentStep === "skills" && (
              <SkillsStep
                skills={parsedSkills}
                onChange={setParsedSkills}
                showReviewBanner={shouldShowReviewBanner()}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            {/* Data Source Step Buttons */}
            {currentStep === "data-source" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Clean up temp file if user cancels during processing
                    if (tempFilePath) {
                      await cleanupTempFile(tempFilePath)
                    }
                    handleOpenChange(false)
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={inputMethod === "auto" ? handleProcessDataSource : () => setCurrentStep("skills")}
                  disabled={!canProceed || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Next"}
                </Button>
              </>
            )}


            {/* Personal Info Step Buttons (Auto Flow) */}
            {currentStep === "personal-info" && inputMethod === "auto" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Clean up temp file if user cancels from personal info step
                    if (tempFilePath) {
                      await cleanupTempFile(tempFilePath)
                    }
                    handleOpenChange(false)
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setCurrentStep("skills")}
                  disabled={!canProceed}
                >
                  Next
                </Button>
              </>
            )}
            
            {/* Skills Step Buttons */}
            {currentStep === "skills" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (inputMethod === "auto") {
                      setCurrentStep("personal-info")
                    } else {
                      setCurrentStep("data-source")
                    }
                  }}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => handleSubmit(
                    (candidate) => {
                      onCandidateCreated?.(candidate)
                      resetDialogState()
                      onOpenChange(false)
                    },
                    {
                      linkedInProfile: rawLinkedInProfile || undefined,
                      resumeText: rawResumeText || undefined,
                      linkedinUrl: linkedinUrl || undefined,
                      resumeUrl: uploadedFileUrl || undefined,
                      fileName: uploadedFile?.name,
                      fileSize: uploadedFile?.size
                    }
                  )}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              The data you are adding will be lost. Are you sure you want to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}