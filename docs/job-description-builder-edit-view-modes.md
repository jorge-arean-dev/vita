# Job Description Builder UI Patterns

This document outlines the user interface patterns, modes, and button behaviors implemented in the Job Description Builder. These patterns can be replicated in other tools for consistency across the application.

## Overview

The Job Description Builder implements a dual-mode interface with **View Mode** and **Edit Mode**, providing users with clear separation between content consumption and content modification workflows.

## Modes

### View Mode
**Purpose**: Content consumption and navigation mode where users can read and interact with saved content.

**Characteristics**:
- Content is **read-only** and cannot be modified
- Job description title displays as static text (non-editable)
- Textarea is disabled (`readOnly={true}`)
- Copy functionality is available for easy content sharing
- Actions are limited to viewing, copying, editing, and deleting

**Available Actions in View Mode**:
- **Edit**: Switch to Edit mode for content modification
- **Delete**: Remove the job description (with confirmation)
- **Copy**: Copy job description content to clipboard
- **Expand/Collapse**: Show or hide job description content

### Edit Mode
**Purpose**: Content creation and modification mode where users can actively change content.

**Characteristics**:
- All content is **editable**
- Job description title becomes an input field with visible border
- Textarea is enabled for content editing
- Copy functionality is hidden (not relevant during editing)
- AI generation is available for content creation
- Changes are tracked as "unsaved" until explicitly saved

**Available Actions in Edit Mode**:
- **Generate**: Create AI-generated content
- **Save**: Persist changes to database
- **Cancel**: Discard changes and return to View mode

## Button Behaviors and Relationships

### Generate Button
**Location**: Edit mode only  
**Position**: First button in Edit mode button group  
**Button Order**: `[Generate] [Save] [Cancel]`

**Behavior**:
- Only visible in Edit mode
- Disabled during save operations
- Shows loading state ("Generating...") with spinner during API call
- Triggers overwrite confirmation if content already exists
- After successful generation:
  - Populates textarea with generated content
  - Remains in Edit mode for further editing
  - Shows informative banner prompting user to review content
  - Marks content as "unsaved changes"

**Overwrite Logic**:
- Checks both saved content and current editing values
- Shows confirmation dialog: "This will overwrite your existing job description. Are you sure you want to continue?"
- Proceeds with generation only after user confirmation

### Save Button
**Location**: Edit mode only  
**Position**: Second button in Edit mode button group  
**Button Order**: `[Generate] [Save] [Cancel]`

**Behavior**:
- Only visible in Edit mode
- Disabled during generation operations
- Shows loading state ("Saving...") with spinner during database operation
- Distinguishes between creating new and updating existing job descriptions
- After successful save:
  - Switches to View mode
  - Clears "unsaved changes" state
  - Shows success toast notification
  - Hides generation info banner (if visible)
  - Updates local state with saved content

**Database Operations**:
- **New job descriptions**: Calls `createJobDescription()` API
- **Existing job descriptions**: Calls `updateJobDescription()` API
- **Error handling**: Shows error toast if operation fails

### Edit Button
**Location**: View mode only (expanded view)  
**Position**: First button in View mode button group  
**Button Order**: `[Edit] [Delete]`

**Behavior**:
- Only visible in View mode when job description is expanded
- Switches interface to Edit mode
- Initializes editing values with current job description content
- Makes title and description fields editable
- Shows Edit mode button group (`[Generate] [Save] [Cancel]`)

**State Changes**:
- `isEditing: true`
- Populates `editingValues` state with current content
- Enables form fields for editing

### Cancel Button
**Location**: Edit mode only  
**Position**: Third button in Edit mode button group  
**Button Order**: `[Generate] [Save] [Cancel]`

**Behavior**:
- Only visible in Edit mode
- Disabled during save and generation operations
- Discards all unsaved changes
- Returns to View mode
- Handles different scenarios based on job description state

**Cancel Logic**:
- **New empty job descriptions**: Removes the job description entirely
- **Existing job descriptions**: Reverts to saved content and switches to View mode
- **Unsaved changes**: Shows confirmation if user tries to collapse/navigate away
- Clears editing values and unsaved changes state
- Hides generation info banner (if visible)

### Delete Button
**Location**: Available in both modes  
**Variants**: 
- **Collapsed view**: Icon-only button
- **Expanded view**: Icon + text button (View mode only)

**Behavior**:
- Shows loading state with spinning icon during deletion
- Always requires confirmation via dialog
- Handles both new (temporary) and existing (database) job descriptions
- Shows success/error toast notifications
- Removes job description from interface after successful deletion

**Confirmation Dialog**:
- Title: "Delete Job Description"
- Message: "Are you sure you want to delete this job description? This action cannot be undone."
- Actions: `[Cancel] [Delete]`

**Database Operations**:
- **New job descriptions**: Only removes from local state
- **Existing job descriptions**: Calls `deleteJobDescription()` API

### Copy Button
**Location**: View mode only (expanded view)  
**Position**: Above textarea, right-aligned  
**Visibility**: Only when job description is expanded and not in Edit mode

**Behavior**:
- Copies job description content to clipboard using `navigator.clipboard.writeText()`
- Shows success toast: "Copied to clipboard"
- Disabled when no content exists
- Icon-only button for minimal visual impact
- Includes accessibility label: "Copy job description"

## Mode Transitions

### View → Edit
**Triggers**:
- Clicking "Edit" button in View mode
- Creating new job description (opens directly in Edit mode)

**Changes**:
- Title becomes editable input field with visible border
- Textarea becomes editable
- Button group changes from `[Edit] [Delete]` to `[Generate] [Save] [Cancel]`
- Copy button disappears
- Editing values are initialized with current content

### Edit → View
**Triggers**:
- Clicking "Save" button (after successful save)
- Clicking "Cancel" button
- Auto-transition after successful save operation

**Changes**:
- Title becomes static text
- Textarea becomes read-only
- Button group changes from `[Generate] [Save] [Cancel]` to `[Edit] [Delete]`
- Copy button appears (if content exists)
- Editing values are cleared
- Unsaved changes state is reset

## State Management

### Key State Variables
- `isExpanded`: Controls content visibility (collapsed/expanded)
- `isEditing`: Controls mode (View/Edit)
- `editingValues`: Temporary storage for unsaved changes
- `unsavedChanges`: Set of IDs with pending changes
- `isGenerating`: Loading state for AI generation
- `isSaving`: Loading state for save operations
- `isDeleting`: Loading state for delete operations

### Unsaved Changes Protection
- Warns users when attempting to collapse/navigate with unsaved changes
- Confirmation message: "You have unsaved changes. Are you sure you want to collapse without saving?"
- Prevents accidental data loss during editing sessions

## User Experience Patterns

### Progressive Disclosure
- **Collapsed view**: Shows minimal information (title + delete button)
- **Expanded view**: Shows full content with appropriate action buttons
- **Edit mode**: Exposes all editing capabilities and AI generation

### Loading States
- All async operations show loading indicators
- Buttons are disabled during operations to prevent double-submission
- Descriptive loading text ("Saving...", "Generating...", "Deleting...")
- Mutual exclusion: Related buttons are disabled during operations

### Feedback Mechanisms
- **Toast notifications**: Success/error messages for all operations
- **Info banner**: Contextual guidance after AI generation
- **Confirmation dialogs**: For destructive actions (delete, overwrite)
- **Visual states**: Button styling indicates action type (primary, destructive, outline)

### Error Handling
- **Network errors**: User-friendly error messages via toast notifications
- **Validation errors**: Prevent invalid operations (empty content, missing data)
- **Graceful degradation**: Fallback behaviors when operations fail

## Implementation Guidelines

### When to Use These Patterns
- **Content management interfaces**: Any tool involving content creation/editing
- **Form-based workflows**: Multi-step forms with save/cancel capabilities
- **AI-assisted content creation**: Tools integrating AI generation with manual editing
- **Document management**: Any interface managing multiple documents/items

### Key Principles
1. **Clear mode distinction**: Visual and functional separation between View and Edit modes
2. **Progressive enhancement**: Start with basic functionality, add advanced features contextually
3. **Consistent button ordering**: Maintain logical flow (Generate → Save → Cancel)
4. **Defensive UX**: Protect users from accidental data loss
5. **Immediate feedback**: Provide clear responses to all user actions

### Accessibility Considerations
- **Keyboard navigation**: All buttons and controls are keyboard accessible
- **Screen readers**: Proper ARIA labels and descriptions
- **Focus management**: Logical tab order and focus indicators
- **Loading states**: Announce state changes to assistive technologies

## Technical Implementation Notes

### Server Actions Integration
- All database operations use Next.js Server Actions
- Proper error handling with user-friendly messages
- Optimistic UI updates with rollback on failure
- Cache invalidation after successful operations

### State Synchronization
- Local state immediately reflects user actions
- Database state is updated asynchronously
- Conflict resolution for concurrent edits
- Proper cleanup of temporary state

### Performance Considerations
- Debounced auto-save (if implemented)
- Minimal re-renders during editing
- Efficient state updates
- Lazy loading of content when possible

---

This pattern documentation serves as a blueprint for implementing consistent, user-friendly interfaces across the application. When building new tools, reference these patterns to maintain UI/UX consistency and provide users with familiar interaction paradigms.