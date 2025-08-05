"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, Link, UserPlus } from "lucide-react"
import ToggleSlider from "@/components/ui/toggle-slider"
import { PersonalInfoStep } from "./PersonalInfoStep"
import { StepProgress } from "./StepProgress"
import type { InputMethod, DataSource, CandidateFormData, Country } from "../types"

interface DataSourceStepProps {
  inputMethod: InputMethod
  onInputMethodChange: (method: InputMethod) => void
  dataSource: DataSource
  onDataSourceChange: (source: DataSource) => void
  linkedinUrl: string
  onLinkedinUrlChange: (url: string) => void
  uploadedFile: File | null
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  fileUploadError: string
  isProcessing: boolean
  uploadProgress: string
  parsingProgress: string
  linkedinProgress: string
  // For manual input
  formData?: CandidateFormData
  onFormDataChange?: (data: Partial<CandidateFormData>) => void
  countries?: Country[]
  countrySearchValue?: string
  onCountrySearchChange?: (value: string) => void
  onCountrySearch?: (searchTerm: string) => void
  onCountrySelect?: (countryCode: string, countryName: string) => void
  isComboOpen?: boolean
  setIsComboOpen?: (open: boolean) => void
  // For progress bar
  showProgressBar?: boolean
  currentStepNumber?: 1 | 2
}

export function DataSourceStep({
  inputMethod,
  onInputMethodChange,
  dataSource,
  onDataSourceChange,
  linkedinUrl,
  onLinkedinUrlChange,
  uploadedFile,
  onFileUpload,
  fileUploadError,
  isProcessing,
  uploadProgress,
  parsingProgress,
  linkedinProgress,
  // Manual input props
  formData,
  onFormDataChange,
  countries,
  countrySearchValue,
  onCountrySearchChange,
  onCountrySearch,
  onCountrySelect,
  isComboOpen,
  setIsComboOpen,
  // Progress bar props
  showProgressBar,
  currentStepNumber
}: DataSourceStepProps) {
  return (
    <div className="space-y-6">
      {/* Input Method Toggle */}
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Choose how you&apos;d like to add this candidate
        </p>
        
        <div className="flex justify-center">
          <ToggleSlider
            option1="Automatic Load"
            option2="Manual Input"
            icon1={<Upload className="h-4 w-4" />}
            icon2={<UserPlus className="h-4 w-4" />}
            defaultOption={inputMethod === "auto" ? 1 : 2}
            onChange={(option) => onInputMethodChange(option === 1 ? "auto" : "manual")}
          />
        </div>
      </div>

      {/* Progress Bar for Manual Input */}
      {showProgressBar && inputMethod === "manual" && (
        <StepProgress 
          currentStep={currentStepNumber || 1}
          steps={[
            { number: 1, title: "Personal Information" },
            { number: 2, title: "Candidate Skills" }
          ]}
        />
      )}

      {/* Auto Load - Data Source Selection */}
      {inputMethod === "auto" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Select Data Source</Label>
            <RadioGroup 
              value={dataSource} 
              onValueChange={(value) => onDataSourceChange(value as DataSource)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="linkedin" id="linkedin" />
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  LinkedIn Profile URL
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  PDF Resume Upload
                </Label>
              </div>
            </RadioGroup>
            
            {/* Input fields below radio buttons */}
            {dataSource === "linkedin" && (
              <div className="space-y-2">
                <Input
                  placeholder="https://linkedin.com/in/candidate-name"
                  value={linkedinUrl}
                  onChange={(e) => onLinkedinUrlChange(e.target.value)}
                />
                
                {/* Progress indicator for LinkedIn processing */}
                {isProcessing && linkedinProgress && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{linkedinProgress}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {dataSource === "pdf" && (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={onFileUpload}
                  className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name}
                  </p>
                )}
                {fileUploadError && (
                  <p className="text-sm text-destructive">
                    {fileUploadError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5MB. PDF files only.
                </p>
                
                {/* Progress indicators */}
                {isProcessing && (uploadProgress || parsingProgress) && (
                  <div className="mt-3 space-y-2">
                    {uploadProgress && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>{uploadProgress}</span>
                      </div>
                    )}
                    {parsingProgress && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>{parsingProgress}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Input Form */}
      {inputMethod === "manual" && formData && onFormDataChange && (
        <PersonalInfoStep
          formData={formData}
          onChange={onFormDataChange}
          countries={countries || []}
          countrySearchValue={countrySearchValue || ""}
          onCountrySearchChange={onCountrySearchChange || (() => {})}
          onCountrySearch={onCountrySearch || (() => {})}
          onCountrySelect={onCountrySelect || (() => {})}
          isComboOpen={isComboOpen || false}
          setIsComboOpen={setIsComboOpen || (() => {})}
          showReviewBanner={false}
        />
      )}
    </div>
  )
}