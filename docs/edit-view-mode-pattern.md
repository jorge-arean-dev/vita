# Edit/View Mode Toggle Behavior - Implementation Guide

## Overview

The edit/view mode system provides a consistent way for users to switch between viewing content (read-only) and editing content (interactive), with built-in safety features like content backup and restore functionality.

## Core States Required

Every section implementing this pattern needs four state variables:

**isEditMode** - Boolean that tracks whether the section is currently in edit mode or view mode. When false, all inputs are disabled/readonly. When true, inputs become interactive.

**isGenerating** - Boolean for sections that support AI generation. Shows loading state during API calls.

**isAutoEditMode** - Boolean that tracks when the section automatically entered edit mode after generation (as opposed to manual edit button click). This affects which buttons are shown.

**backupContent** - Stores a copy of the content before any editing begins, allowing users to cancel changes and restore the previous state.

## Button Display Logic

The buttons shown depend on the current state combination:

**View Mode (Normal State)**: Show both Generate and Edit buttons. This is when users can either generate new content or manually edit existing content.

**Edit Mode (After Manual Edit)**: Show Save and Cancel buttons. Users can either save their changes to persist them, or cancel to restore the backup.

**Auto-Edit Mode (After Generation)**: Show only Save and Cancel buttons, hide Generate and Edit buttons. This happens automatically after content generation.

**Generating State**: Show a disabled "Generating..." button to indicate the API call is in progress.

## Workflows

### Manual Edit Workflow

When a user clicks the Edit button, the system first creates a backup copy of all current content. This backup is crucial for the cancel functionality. Then it switches to edit mode, making all input fields interactive. The Generate and Edit buttons disappear, replaced by Save and Cancel buttons.

If the user clicks Save, the system persists the changes (to database or parent state), exits edit mode, and clears the backup since it's no longer needed.

If the user clicks Cancel, the system restores the content from the backup, effectively undoing all changes made during the edit session, then exits edit mode.

### Generate Workflow

When a user clicks Generate, the system first checks if there's existing content that would be overwritten. If so, it shows a confirmation dialog. After confirmation, it creates a backup of the current content, then starts the generation process.

Once the API call completes and new content is populated, the system automatically enters edit mode (auto-edit mode specifically). This is different from manual edit because it hides the Generate and Edit buttons entirely - the user must either save the generated content or cancel to restore the previous content.

An informational blue bar appears prompting the user to review the generated content before saving.

## Input Field Behavior

All input fields must respect the edit mode state:

**In View Mode**: Inputs use readOnly or disabled props to prevent interaction. They typically also get a "cursor-default" class to show they're not clickable.

**In Edit Mode**: Inputs function normally, allowing user interaction.

This applies to text inputs, dropdowns, checkboxes, and any other interactive elements.

## Safety Features

### Content Backup System

Before any potentially destructive action (editing or generating), the system creates a complete backup of the current content. This backup enables the cancel functionality - users can always return to the state before they started making changes.

The backup is cleared when changes are saved (since they're now permanent) or when cancel restores the content.

### Overwrite Protection

When generating new content, if existing content would be lost, the system shows a confirmation dialog asking the user to confirm they want to proceed.

### State Consistency

The button logic ensures users can't get stuck in invalid states. The combinations of state variables determine exactly which buttons are available at any time.

## Visual Feedback

### Info Indicator Bar

When in auto-edit mode (after generation), a blue informational bar appears with an info icon and text like "Please review the generated content and click Save to confirm." This uses a consistent blue color scheme that can be reused across the app.

### Button States

Buttons clearly indicate the current mode - Generate/Edit in view mode, Save/Cancel in edit mode, and disabled "Generating..." during API calls.

## Implementation Steps for New Sections

To add this behavior to a new section:

**Step 1**: Add the four required state variables to your component.

**Step 2**: Create the three handler functions - handleEdit, handleSave, and handleCancel. Include handleGenerate if the section supports AI generation.

**Step 3**: Update your button rendering to show the correct buttons based on the state combination.

**Step 4**: Add readOnly or disabled props to all input fields, controlled by the isEditMode state.

**Step 5**: Add the info indicator bar that appears during auto-edit mode.

**Step 6**: Implement the backup and restore logic specific to your content structure.

**Step 7**: Test the complete flow: view mode → edit mode → save/cancel, and if applicable, view mode → generate → auto-edit → save/cancel.

## Code Examples

### State Variables
```typescript
const [isEditMode, setIsEditMode] = useState(false)
const [isGenerating, setIsGenerating] = useState(false) // Optional for sections with generate
const [isAutoEditMode, setIsAutoEditMode] = useState(false) // For auto-edit after generate
const [backupContent, setBackupContent] = useState<ContentType | null>(null)
```

### Button Display Logic
```typescript
// Show Generate & Edit buttons (view mode)
{!isEditMode && !isGenerating && !isAutoEditMode && (
  <>
    <Button onClick={handleGenerate}>Generate</Button> // Optional
    <Button onClick={handleEdit}>Edit</Button>
  </>
)}

// Show Save & Cancel buttons (edit mode)
{isEditMode && (
  <>
    <Button onClick={handleSave}>Save</Button>
    <Button onClick={handleCancel}>Cancel</Button>
  </>
)}

// Show generating state (optional)
{isGenerating && (
  <Button disabled>Generating...</Button>
)}
```

### Handler Functions

#### Manual Edit Mode
```typescript
const handleEdit = () => {
  // Backup current content before editing
  setBackupContent({ ...currentContent })
  setIsEditMode(true)
  setIsAutoEditMode(false)
}

const handleSave = () => {
  // Save content to database/state
  console.log("Saving content:", currentContent)
  
  // Exit edit mode and clear backup
  setIsEditMode(false)
  setIsAutoEditMode(false)
  setBackupContent(null)
}

const handleCancel = () => {
  // Restore backup content if available
  if (backupContent) {
    setCurrentContent(backupContent)
    setBackupContent(null)
  }
  
  // Exit edit mode
  setIsEditMode(false)
  setIsAutoEditMode(false)
}
```

#### Generate Mode
```typescript
const handleGenerate = async () => {
  // Check for existing content
  if (hasExistingContent()) {
    const confirmed = window.confirm("This will overwrite existing content...")
    if (!confirmed) return
  }

  // Backup current content
  setBackupContent({ ...currentContent })
  setIsGenerating(true)
  
  try {
    // API call and content population
    const newContent = await generateContent()
    setCurrentContent(newContent)
    
    // Auto-enter edit mode
    setIsAutoEditMode(true)
    setIsEditMode(true)
    
  } catch (error) {
    console.error("Generation error:", error)
  } finally {
    setIsGenerating(false)
  }
}
```

### Input Field Implementation
```typescript
// Text inputs
<Input
  value={content.field}
  onChange={(e) => setContent(prev => ({ ...prev, field: e.target.value }))}
  readOnly={!isEditMode}
  className={!isEditMode ? "cursor-default" : ""}
/>

// Dropdowns
<Select
  value={content.option}
  onValueChange={(value) => setContent(prev => ({ ...prev, option: value }))}
  disabled={!isEditMode}
>
```

### Info Indicator
```typescript
{isAutoEditMode && (
  <div className="info-indicator mx-6">
    <Info className="h-4 w-4 flex-shrink-0" />
    <span>Please review the generated content and click Save to confirm.</span>
  </div>
)}
```

## CSS Classes Required

Add these classes to your global stylesheet:

```css
/* Info indicator bar for informative notifications */
.info-indicator {
  @apply bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md;
  @apply flex items-center gap-2 text-sm;
}

.dark .info-indicator {
  @apply bg-blue-950 border-blue-800 text-blue-200;
}
```

## Key Behavior Rules

1. **View Mode Default**: Section starts in view mode (all inputs disabled/readonly)

2. **Manual Edit**: 
   - Creates backup → Enables editing → Show Save/Cancel
   - Save → Persist changes → Return to view mode
   - Cancel → Restore backup → Return to view mode

3. **Generate Mode**:
   - Creates backup → Generates content → **Auto-enters edit mode**
   - Hide Generate/Edit buttons during auto-edit
   - Show info indicator prompting review
   - Same Save/Cancel behavior as manual edit

4. **Input States**:
   - **View Mode**: `readOnly={true}` or `disabled={true}` + `cursor-default`
   - **Edit Mode**: Normal interactive inputs

5. **Backup System**:
   - Always backup before any destructive action (edit/generate)
   - Cancel always restores backup
   - Save clears backup

This pattern ensures users always know what mode they're in, can safely experiment with changes, and have a consistent experience across all sections of the application.