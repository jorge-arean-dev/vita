# Unsaved Changes Protection Pattern

This document describes the standard pattern for implementing unsaved changes protection in form dialogs across the application.

## Overview

The unsaved changes protection pattern prevents users from accidentally losing their input data when closing dialogs or navigating away from forms. It displays a confirmation dialog when users attempt to close a form that has unsaved changes.

## Key Components

### 1. State Management
```typescript
// Track if form has been modified
const [isDirty, setIsDirty] = useState(false)
const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
```

### 2. Form Change Tracking
```typescript
// Example input with change tracking
<Input
  value={formData.fieldName}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, fieldName: e.target.value }))
    setIsDirty(true) // Mark form as dirty when user types
  }}
/>
```

### 3. Dialog Close Handler
```typescript
const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen) {
    // Check if there are unsaved changes
    if (isDirty) {
      setShowUnsavedChangesDialog(true)
      return // Prevent closing
    }
    resetForm()
  }
  onOpenChange(newOpen)
}
```

### 4. Form Reset Function
```typescript
const resetForm = () => {
  // Reset all form state
  setFormData(initialFormState)
  setIsDirty(false) // Clear dirty flag
  // Reset any other form-related state
}
```

### 5. Successful Submission Handler
```typescript
const handleSubmit = () => {
  // ... validation logic ...
  
  startTransition(async () => {
    try {
      const result = await serverAction(formData)
      
      if (result.success) {
        toast.success("Created successfully!")
        resetForm() // Clear form and dirty state
        onOpenChange(false) // Bypass unsaved changes check
        onEntityCreated?.() // Callback for parent component
      } else {
        toast.error(result.error)
        // Keep dialog open and maintain dirty state
      }
    } catch (error) {
      toast.error("An error occurred")
      // Keep dialog open and maintain dirty state
    }
  })
}
```

### 6. Confirmation Dialog Component
```typescript
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
```

### 7. Confirm Close Handler
```typescript
const handleConfirmClose = () => {
  setShowUnsavedChangesDialog(false)
  resetForm()
  onOpenChange(false)
}
```

## Required Imports

```typescript
import { useState, useTransition } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
```

## Implementation Checklist

### ✅ Setup Phase
- [ ] Add `isDirty` and `showUnsavedChangesDialog` state variables
- [ ] Create `resetForm()` function that clears all form state and sets `isDirty = false`
- [ ] Create `handleOpenChange()` function that checks for unsaved changes
- [ ] Create `handleConfirmClose()` function for confirmation dialog

### ✅ Form Integration
- [ ] Add `setIsDirty(true)` to ALL form input onChange handlers
- [ ] Add `setIsDirty(true)` to dropdown/select change handlers
- [ ] Add `setIsDirty(true)` to any other form state changes

### ✅ Submission Flow
- [ ] In successful submission: call `resetForm()` then `onOpenChange(false)` directly
- [ ] In failed submission: keep dialog open and maintain `isDirty` state
- [ ] In validation errors: don't change `isDirty` state

### ✅ Dialog Components
- [ ] Add AlertDialog component with proper messaging
- [ ] Ensure main dialog uses `handleOpenChange` prop
- [ ] Test all close actions: Cancel button, ESC key, clicking outside

## Behavior Requirements

### ✅ When Dialog Should Appear
- User has typed/changed ANY field (`isDirty = true`)
- User attempts to close via: Cancel button, ESC key, clicking outside dialog
- User switches between form modes (if applicable)

### ❌ When Dialog Should NOT Appear
- User clicks Submit/Create button (even with data)
- No changes have been made to the form (`isDirty = false`)
- Form submission is successful (dialog closes immediately)

## Testing Scenarios

1. **Happy Path**: Fill form → Submit → Dialog closes without confirmation
2. **Cancel with Changes**: Fill form → Click Cancel → Confirmation appears
3. **ESC with Changes**: Fill form → Press ESC → Confirmation appears
4. **Click Outside**: Fill form → Click outside → Confirmation appears
5. **No Changes**: Open dialog → Close immediately → No confirmation
6. **Validation Error**: Fill form with invalid data → Submit → Stay open, keep dirty state
7. **Server Error**: Fill form → Submit fails → Stay open, keep dirty state

## Example Implementation

See `components/create-talent-dialog.tsx` for a complete reference implementation.

## Notes

- Always test with real user interactions to ensure smooth UX
- The confirmation message should be clear about data loss
- Successful submissions should bypass the confirmation entirely
- Failed submissions should preserve the user's input and dirty state