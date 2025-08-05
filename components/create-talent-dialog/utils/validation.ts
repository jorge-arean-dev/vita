export function validateFile(file: File | null): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected" }
  }

  // Validate file type
  if (file.type !== "application/pdf") {
    return { valid: false, error: "Please upload a PDF file only" }
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File size must be less than 5MB" }
  }

  return { valid: true }
}

export function canProceedToNext(
  inputMethod: "auto" | "manual",
  currentStep: string,
  dataSource?: "linkedin" | "pdf",
  linkedinUrl?: string,
  uploadedFile?: File | null,
  formData?: {
    firstName: string
    lastName: string
    email: string
  }
): boolean {
  if (inputMethod === "auto" && currentStep === "data-source") {
    return dataSource === "linkedin" 
      ? (linkedinUrl?.trim() || "") !== ""
      : uploadedFile !== null
  }
  
  // For personal-info step or manual input
  if (formData) {
    return formData.firstName.trim() !== "" && 
           formData.lastName.trim() !== "" && 
           formData.email.trim() !== ""
  }
  
  return false
}