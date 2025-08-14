# Edit/View Mode Pattern - Implementation Guide

## Overview

The edit/view mode system provides a consistent way for users to switch between viewing content (read-only) and editing content (interactive), with built-in safety features including unsaved changes detection, confirmation dialogs, and proper state management. This pattern is implemented comprehensively in the job description builder.

## Core Concepts

### State Management Architecture

The pattern uses three key state objects to manage editing lifecycle:

1. **Current Display Values**: What the user sees (read-only or editable)
2. **Editing Values**: Temporary values during editing sessions  
3. **Original Values**: Baseline for change detection (represents saved state)

### Change Detection System

Changes are detected by comparing `editingValues` against `originalValues`:
- **New items**: No `originalValues` entry → changes detected if content exists
- **Existing items**: Compare current editing values with saved values
- **After generation**: Generation acts like manual editing (doesn't update `originalValues`)

## Required State Variables

```typescript
// Core display state
const [items, setItems] = useState<Item[]>([])
const [editingValues, setEditingValues] = useState<{ [key: string]: EditingState }>({})
const [originalValues, setOriginalValues] = useState<{ [key: string]: EditingState }>({})

// UI state management
const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})

// Confirmation dialogs
const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
const [collapseConfirmId, setCollapseConfirmId] = useState<string | null>(null)
const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)

// Unsaved changes tracking
const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
```

## Change Detection Function

```typescript
const hasChanges = (id: string): boolean => {
  const current = editingValues[id]
  const original = originalValues[id]
  
  // If no current editing values, no changes
  if (!current) return false
  
  // If no original values (new item), check if there's any content
  if (!original) {
    return current.title.trim() !== '' || current.content.trim() !== ''
  }
  
  // Compare current values with original values
  return current.title !== original.title || current.content !== original.content
}
```

## Button States and Actions

### Save Button Logic
```typescript
// Save button is enabled when there are changes
<Button 
  disabled={!hasChanges(id) || isSaving[id]} 
  onClick={() => handleSave(id)}
>
  {isSaving[id] ? "Saving..." : "Save"}
</Button>
```

### Cancel/Collapse with Confirmation
```typescript
const handleCancel = (id: string) => {
  // Check if there are unsaved changes
  if (hasChanges(id)) {
    setCancelConfirmId(id)
    return
  }
  
  // No changes, proceed with cancel
  proceedWithCancel(id)
}
```

### Generate Button Behavior
```typescript
const handleGenerate = (id: string) => {
  // Check for existing content that would be overwritten
  const hasContent = editingValues[id]?.content?.trim()
  if (hasContent) {
    setOverwriteConfirmId(id)
    return
  }
  
  proceedWithGeneration(id)
}

const proceedWithGeneration = async (id: string) => {
  setIsGenerating({ ...isGenerating, [id]: true })
  
  try {
    const result = await generateContent(id)
    
    const newValues = {
      title: result.title,
      content: result.content
    }
    
    // Update editing values (acts like manual edit)
    setEditingValues({
      ...editingValues,
      [id]: newValues
    })
    
    // NEVER update originalValues during generation
    // Generation should be treated as an edit operation
    
  } finally {
    setIsGenerating({ ...isGenerating, [id]: false })
  }
}
```

## Item Lifecycle Management

### Adding New Items
```typescript
const addNewItem = () => {
  const newItem = {
    id: `new-${Date.now()}`,
    title: `New Item ${counter}`,
    content: '',
    isEditing: true,
    isExpanded: true
  }
  
  // Initialize editing values
  setEditingValues({
    ...editingValues,
    [newItem.id]: {
      title: newItem.title,
      content: newItem.content
    }
  })
  
  // DON'T set originalValues for new items
  // This ensures hasChanges() works correctly
  
  setItems([newItem, ...items])
}
```

### Saving Items
```typescript
const handleSave = async (id: string) => {
  const editingData = editingValues[id]
  if (!editingData) return
  
  setIsSaving({ ...isSaving, [id]: true })
  
  try {
    if (id.startsWith('new-')) {
      // Create new item
      const result = await createItem(id, editingData.title, editingData.content)
      // Update with real ID from database
      updateItemAfterSave(id, result.id, editingData)
    } else {
      // Update existing item
      await updateItem(id, editingData.title, editingData.content)
    }
    
    // Set original values to current values (represents new saved state)
    setOriginalValues({
      ...originalValues,
      [id]: { ...editingData }
    })
    
    // Exit edit mode
    setItems(items.map(item => 
      item.id === id ? { ...item, isEditing: false } : item
    ))
    
  } finally {
    setIsSaving({ ...isSaving, [id]: false })
  }
}
```

## Confirmation Dialog Pattern

### Styled Confirmation Dialogs
```typescript
{/* Cancel Confirmation Dialog */}
<AlertDialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Discard Changes</AlertDialogTitle>
      <AlertDialogDescription>
        You have unsaved changes. Are you sure you want to cancel without saving? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep Editing</AlertDialogCancel>
      <AlertDialogAction 
        onClick={() => {
          if (cancelConfirmId) {
            proceedWithCancel(cancelConfirmId)
            setCancelConfirmId(null)
          }
        }}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Discard Changes
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Overwrite Confirmation Dialog */}
<AlertDialog open={!!overwriteConfirmId} onOpenChange={() => setOverwriteConfirmId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Overwrite Existing Content</AlertDialogTitle>
      <AlertDialogDescription>
        This will overwrite your existing content. Are you sure you want to continue?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        if (overwriteConfirmId) {
          proceedWithGeneration(overwriteConfirmId)
          setOverwriteConfirmId(null)
        }
      }}>
        Continue
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Loading States

### Generation Loading Overlay
```typescript
{/* Text Area with Loading Overlay */}
<div className="space-y-2 relative">
  <Textarea
    value={editingValues[id]?.content || ''}
    onChange={(e) => handleContentChange(id, e.target.value)}
    readOnly={!item.isEditing || isGenerating[id]}
    className="min-h-[500px] resize-none"
  />
  
  {/* Generation Loading Overlay */}
  {isGenerating[id] && (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Sparkles className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-lg font-medium">Generating content...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while AI creates your content
          </p>
        </div>
      </div>
    </div>
  )}
</div>
```

## Key Behavioral Rules

### 1. Change Detection Logic
- **New items**: Never set `originalValues` → `hasChanges()` returns `true` if content exists
- **Existing items**: Set `originalValues` on edit mode entry → `hasChanges()` compares current vs saved
- **After generation**: Never update `originalValues` → Generation acts like manual editing

### 2. Save Button State
- **Enabled**: When `hasChanges()` returns `true` AND not currently saving
- **Disabled**: When no changes detected OR save operation in progress
- **Text**: Shows "Saving..." during save operations

### 3. Confirmation Dialogs
- **Cancel/Collapse**: Show confirmation if `hasChanges()` returns `true`
- **Generate**: Show overwrite confirmation if existing content would be lost
- **Consistent styling**: Use AlertDialog with destructive styling for destructive actions

### 4. Item Lifecycle
- **New items**: Start in edit mode, no `originalValues`, removed if cancelled with no content
- **Existing items**: Start in view mode, `originalValues` set on edit entry, revert on cancel
- **Collapse behavior**: For new items, acts like cancel (removes item); for existing, just collapses

### 5. Generation Behavior
- **UI State**: Show loading overlay, disable textarea, update button states  
- **Data Flow**: Update only `editingValues`, never `originalValues`
- **User Flow**: Acts exactly like manual editing for save/cancel logic

### 6. State Management
- **Editing values**: Always represents current user input
- **Original values**: Always represents last saved state (or undefined for new items)
- **Change detection**: Always compares these two states

## Toast Integration

Use the shadcn/ui toast system for user feedback:

```typescript
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()

// Success feedback
toast({
  title: "Success",
  description: "Item saved successfully!",
})

// Error feedback  
toast({
  title: "Error",
  description: "Failed to save item. Please try again.",
  variant: "destructive",
})
```

## Implementation Checklist

When implementing this pattern in a new component:

- [ ] Set up three state objects: display items, editing values, original values
- [ ] Implement `hasChanges()` function with proper new vs existing item logic
- [ ] Add confirmation dialogs with consistent styling
- [ ] Implement loading states with overlays for long operations
- [ ] Set up proper button states (save enabled/disabled, loading states)
- [ ] Handle new item lifecycle (no original values, cancel removes item)
- [ ] Ensure generation acts like editing (updates only editing values)
- [ ] Add toast notifications for user feedback
- [ ] Test complete flows: new item creation, existing item editing, generation, cancellation

This pattern provides a robust, user-friendly editing experience with proper safety mechanisms and consistent behavior across the application.