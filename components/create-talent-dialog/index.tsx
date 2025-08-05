"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

// Local imports
import type { CreateTalentDialogProps, InputMethod, DataSource, Step } from "./types"
import { useCandidateForm } from "./hooks/useCandidateForm"
import { useResumeProcessor } from "./hooks/useResumeProcessor"
import { useLinkedInProcessor } from "./hooks/useLinkedInProcessor"
import { DataSourceStep } from "./components/DataSourceStep"
import { PersonalInfoStep } from "./components/PersonalInfoStep"
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
    updateFormWithCountry
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
  const resetDialogState = () => {
    setCurrentStep("data-source")
    setInputMethod("auto")
    setDataSource("linkedin")
    setLinkedinUrl("")
    setUploadedFile(null)
    setFileUploadError("")
    resetForm()
  }

  // Confirm close with unsaved changes
  const handleConfirmClose = () => {
    setShowUnsavedChangesDialog(false)
    resetDialogState()
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
      default:
        return "Create Candidate"
    }
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

  // Get info message for personal info step
  const getPersonalInfoMessage = () => {
    if (inputMethod === "auto" && dataSource === "pdf" && parsedSkills.length > 0) {
      return "Great! We've extracted information from your resume. Please review the details below and make any necessary adjustments before creating the candidate profile."
    }
    if (inputMethod === "auto") {
      return "Please review the pre-filled information below. You can edit any field as needed. All changes can be updated later from the candidate profile."
    }
    if (inputMethod === "manual") {
      return "Please enter the candidate's information. You'll be able to add skills in the next step."
    }
    return ""
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

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
                infoMessage={getPersonalInfoMessage()}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            {/* Data Source Step Buttons */}
            {currentStep === "data-source" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={inputMethod === "auto" ? handleProcessDataSource : () => handleSubmit((candidate) => {
                    onCandidateCreated?.(candidate)
                    onOpenChange(false)
                  })}
                  disabled={!canProceed || isProcessing || isPending}
                >
                  {isProcessing ? "Processing..." : isPending ? "Creating..." : inputMethod === "auto" ? "Next" : "Create"}
                </Button>
              </>
            )}


            {/* Personal Info Step Buttons (Auto Flow) */}
            {currentStep === "personal-info" && inputMethod === "auto" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("data-source")}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => handleSubmit((candidate) => {
                    onCandidateCreated?.(candidate)
                    onOpenChange(false)
                  })}
                  disabled={!canProceed || isPending}
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