# CLAUDE.md - Project Development Guidelines

This file contains essential guidelines and best practices for AI assistants working on this Next.js project. These rules ensure code quality, security, and consistency.

## Project Stack & Architecture

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **UI**: Shadcn UI, Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Server Components, Server Actions
- **Validation**: Zod
- **Styling**: Tailwind CSS with CSS custom properties

## Global Development Rules

### Package Management & Environment
- **Use pnpm exclusively** - Never use npm or yarn
- **Development server** runs on port 3000
- **Use available MCP servers** for knowledgebase and understanding
- **Console logs** - Fetch logs from the console for debugging
- **Package installation** - Don't install packages unless explicitly asked

### Component Organization
- **Place components** in the `/components` directory
- **Combine by usecase** in subdirectories for better organization
- **Always use `/components/ui`** to build new components
- **Prefer iteration and modularization** over code duplication

### Code Quality & Security
- **Suggest performance improvements** proactively
- **Point out potential security issues** and suggest solutions
- **Maintain code quality** through modular, reusable patterns

### Implementation Patterns
- **Reference pattern documentation** in `/docs/patterns/` for common UI/UX implementations
- **Use established patterns** for consistency across the application
- **Available patterns**: Unsaved changes protection, form validation, dialog management
- **Apply patterns contextually** - not every component needs every pattern

## Core Development Rules

### TypeScript Standards
- All code must be written in TypeScript with strict mode enabled
- Use interfaces instead of types for object shapes
- Avoid `any`; use `unknown` or explicit types when unsure
- Prefer functional components with clearly typed props
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)

### Project Organization
- Use the `app/` directory structure (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`)
- Group files by domain when possible (e.g., `features/auth`, `features/dashboard`)
- Use `lib/` for low-level logic like the Supabase client or third-party utilities
- Place migrations and edge functions inside the `supabase/` directory

### Naming Conventions
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Use named exports for components
- Avoid enums; use plain object maps
- File structure: exported component → subcomponents → helpers → static → types

### Code Style
- Write concise, technical TypeScript with accurate examples
- Use comments to help explain technical concepts and functions
- Prefer functional and declarative patterns over classes
- Avoid code duplication via helper functions and modular components

## Supabase Integration Rules

### Critical Requirements
1. **MUST use `@supabase/ssr`** - Never use deprecated `@supabase/auth-helpers-nextjs`
2. **MUST use ONLY `getAll` and `setAll`** for cookie management
3. **MUST NEVER use `get`, `set`, or `remove`** - These will break the application
4. **MUST enable Row Level Security (RLS)** on every table

### Correct Implementation Patterns

#### Browser Client
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server Client
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Security Requirements
- **Environment Variables**: Never expose secrets in the browser
- **RLS Policies**: Write rules that validate user identity via `auth.uid()`
- **Auth Guards**: Use server-side validation for all sensitive logic
- **Input Validation**: Validate all inputs with `zod` or similar
- **Session Management**: Use Supabase Auth session checks on protected routes

## UI & Styling Guidelines

### Component Development
- Use Shadcn UI + Radix for components
- Tailwind CSS for layout, spacing, and utility styles
- Mobile-first and responsive by default
- Use `dark:` variants to support dark mode
- Use accessible Radix primitives and Shadcn components
- Ensure proper `aria-*`, focus handling, and keyboard support

### Font System Rules
- **NEVER modify individual component font styles directly**
- **ALWAYS use the centralized FontProvider system**
- **MAINTAIN** CSS variables: `--font-titles`, `--font-text`, `--font-mono`
- **PRESERVE** portal element targeting for Radix UI components
- Apply font variables to `document.documentElement` for portal accessibility

### Portal Element Targeting
Portal-based components (DropdownMenu, Dialog, Tooltip, etc.) require special CSS targeting:
```css
[data-radix-portal] *, 
[data-slot="dropdown-menu-content"] *, 
[data-slot="alert-dialog-content"] *,
[data-slot="dialog-content"] *,
[data-slot="tooltip-content"] *,
[data-slot="popover-content"] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}
```

### Toast System Guidelines

#### **CRITICAL**: Use Only ShadCN Toast System
- **NEVER use `import { toast } from "sonner"`** - This will not display properly
- **ALWAYS use `import { useToast } from "@/components/ui/use-toast"`** - This is the configured system
- **Only one toast system** is set up in the app layout (`<Toaster />` from shadcn/ui)

#### Correct Toast Implementation
```typescript
// ✅ CORRECT - Use ShadCN toast system
import { useToast } from "@/components/ui/use-toast"

function MyComponent() {
  const { toast } = useToast()
  
  // Success toast
  toast({
    title: "Success",
    description: "Operation completed successfully!",
  })
  
  // Error toast
  toast({
    title: "Error", 
    description: "Something went wrong. Please try again.",
    variant: "destructive",
  })
  
  // Warning toast
  toast({
    title: "Warning",
    description: "Please review your input.",
    variant: "destructive", // Use destructive for warnings too
  })
  
  // Validation error toast
  toast({
    title: "Validation Error",
    description: "Email is required",
    variant: "destructive",
  })
}
```

#### Toast Anti-Patterns
```typescript
// ❌ WRONG - Will not display
import { toast } from "sonner"
toast.success("This won't show")
toast.error("This won't show either")

// ❌ WRONG - Missing hook
function BadComponent() {
  // No useToast hook
  toast({ title: "Error" }) // This will fail
}

// ❌ WRONG - Incorrect format
const { toast } = useToast()
toast.success("Wrong format") // toast.success doesn't exist in shadcn
```

#### Toast Troubleshooting
- **Toast not showing?** Check if you're using `useToast()` hook and shadcn format
- **Page refreshing too quickly?** Use proper state management instead of `window.location.reload()`
- **Multiple toast systems?** Remove all `sonner` imports and use only shadcn
- **Check layout setup:** Ensure `<Toaster />` from shadcn is in root layout

## Performance Optimization

### React Best Practices
- Minimize use of `'use client'`, `useEffect`, and `setState`
- Use React Server Components and Server Actions when possible
- Wrap client components in `<Suspense>` with fallbacks
- Lazy load non-critical components
- Optimize images: use WebP, include width/height, lazy-load

### Caching Strategy
- Use `unstable_noStore()` for all user-specific pages to prevent data leakage
- Apply cache control headers for user-specific content in middleware
- Use user-specific cache keys for client-side caching
- Clear all caches on user logout

### State Management
- Use `useFormState` and `useFormStatus` with server actions
- Use `useOptimistic` for lightweight interactive state
- Avoid global state libraries unless necessary

## User Cache Isolation (Critical for SaaS)

### Cache Management Requirements
- **Add `noStore()` to all user-specific pages** - Dashboard, profile, settings, etc.
- **Use user-specific cache keys** - Format: `cache_${userId}_${resource}`
- **Clear caches on logout** - Both sessionStorage and localStorage
- **Set proper cache headers** - `no-cache, no-store, must-revalidate, private`

### Authentication State Management
- Monitor auth state changes globally
- Force hard navigation on logout: `window.location.href = "/"`
- Clear all client-side caches on user switch
- Use enhanced logout procedures

## Development Workflow

### Linting & Quality
- Use ESLint, Prettier, and TypeScript strict mode
- Validate all inputs with `zod`
- Ensure `pnpm dev` starts cleanly with no TypeScript errors
- Document key decisions in `README.md` or `docs/`

### Testing Requirements
- Test multi-user scenarios in production environment
- Verify user data isolation between sessions
- Test portal components for font inheritance
- Ensure mobile device compatibility

## Common Commands

- **Development**: `pnpm dev`
- **Build**: `pnpm build`
- **Type Check**: `pnpm type-check` (verify this command exists)
- **Lint**: `pnpm lint` (verify this command exists)

## File References for Common Tasks

### Font Modifications
- `@components/ui/font-provider.tsx` - Font configuration
- `@app/globals.css` - Global styles and portal targeting
- `@docs/recommendations/font-provider-common-issues.md` - Best practices

### Database Changes
- `@supabase/migrations/` - Migration patterns
- `@types/database.types.ts` - TypeScript definitions

### Component Development
- `@components/ui/` - Component library patterns
- `@app/globals.css` - Global styling approach
- `@components.json` - Shadcn UI configuration

### Authentication Work
- `@lib/supabase/` - Auth configuration
- `@middleware.ts` - Route protection
- `@hooks/use-auth-state.ts` - State management

## AI Assistant Guidelines

When working on this project:
1. **Always review relevant files** before making changes
2. **Follow existing patterns** and conventions consistently
3. **Maintain security best practices** especially for user data isolation
4. **Test thoroughly** especially multi-user scenarios
5. **Document changes** and explain reasoning
6. **Preserve font system** architecture and portal targeting
7. **Use proper Supabase patterns** - never use deprecated helpers

## Critical Anti-Patterns to Avoid

- ❌ Using `npm` or `yarn` instead of `pnpm`
- ❌ Installing packages without explicit request
- ❌ Placing components outside `/components` directory structure
- ❌ Using `@supabase/auth-helpers-nextjs` (deprecated)
- ❌ Using `get`, `set`, or `remove` for cookie management
- ❌ Modifying component fonts directly instead of using FontProvider
- ❌ **Using `import { toast } from "sonner"` - Will not display toasts**
- ❌ **Using `toast.success()` or `toast.error()` format - Wrong toast system**
- ❌ Generic cache keys that could cause user data collisions
- ❌ Missing `noStore()` on user-specific pages
- ❌ Exposing secrets in client-side code
- ❌ Bypassing RLS policies for data access
- ❌ Code duplication instead of modular, reusable patterns

## TypeScript Error Prevention Guidelines

### 🔍 Interface and Type Safety Rules

**CRITICAL**: Always verify interface definitions before accessing properties

#### Before Writing Any Property Access:
1. **Read the interface definition first** - Use `Read` or `Grep` to find the exact interface
2. **Check all property names** - Ensure exact spelling and existence
3. **Verify property types** - Confirm the property type matches expected usage
4. **Use optional chaining** - Always use `?.` for potentially undefined properties

#### Interface Definition Verification Process:
```typescript
// ❌ WRONG - Assuming properties exist
analysis.candidateInfo.firstName  // firstName might not exist

// ✅ CORRECT - Verify interface first, then access safely
interface CandidateInfo {
  name: string
  type: "existing" | "new"
  source?: string
  // firstName does NOT exist!
}
analysis.candidateInfo?.name || "Unknown"
```

### 🏗️ Type Architecture Rules

#### Separate Type Handling:
1. **Never mix different types in the same section** - Each component section should handle one type
2. **Use type guards properly** - Check for distinguishing properties before casting
3. **Avoid unsafe type casting** - Never cast between unrelated types
4. **Create helper functions** - Use helpers to abstract type differences

#### Union Type Handling:
```typescript
// ❌ WRONG - Unsafe casting between unrelated types
(analysis as ExistingMatchAnalysis).match_analysis

// ✅ CORRECT - Use type guards or helper functions
const getAnalysisData = (analysis: MatchAnalysis | ExistingMatchAnalysis) => {
  if ('results' in analysis) {
    return analysis.results.match_analysis
  } else {
    return analysis.match_analysis
  }
}
```

### 🔧 Code Structure Rules

#### State Management:
1. **Define intersection types properly** - Use `&` for extending interfaces
2. **Initialize state with all required properties** - Don't leave properties undefined
3. **Use literal types for constants** - `as const` for immutable values

#### Property Access Patterns:
```typescript
// ❌ WRONG - Accessing non-existent properties
analysis.candidateInfo.firstName

// ✅ CORRECT - Access only defined properties
analysis.candidateInfo.name

// ❌ WRONG - Mixed type access in same section
analysis.candidateInfo?.name || analysis.candidates?.first_name

// ✅ CORRECT - Separate sections for different types
// Section 1: Handle MatchAnalysis
analysis.candidateInfo?.name
// Section 2: Handle ExistingMatchAnalysis  
analysis.candidates?.first_name
```

### 🛠️ Error Prevention Checklist

Before making any component changes:

- [ ] **Read all relevant interface definitions**
- [ ] **Verify every property access matches the interface**
- [ ] **Check for type mixing in single sections**
- [ ] **Use helper functions for cross-type operations**
- [ ] **Test with `pnpm build` before claiming completion**
- [ ] **Search for similar patterns that might have same issues**

### 🚨 Red Flag Patterns to Avoid

1. **Property Access Without Verification**: Accessing `.someProperty` without checking interface
2. **Unsafe Type Casting**: `(object as DifferentType)` between unrelated types  
3. **Mixed Type Handling**: One section trying to handle multiple unrelated types
4. **Assumed Properties**: Assuming properties exist based on similar objects
5. **Missing Optional Chaining**: Accessing nested properties without `?.`

### 📋 Pre-Commit Verification

Always run before claiming a task is complete:
1. `pnpm build` - Must pass without TypeScript errors
2. Check all property accesses match their interfaces
3. Verify no unsafe type casting exists
4. Confirm separation of concerns between different types

## Build Error Prevention Guidelines

### 🚨 Critical Type Safety Rules

Based on analysis of common build failures, follow these mandatory rules:

#### Database Query Return Type Handling
1. **Array vs Object Disambiguation**: When Supabase returns joined data, explicitly handle array/object ambiguity
   ```typescript
   // ❌ WRONG - Assumes consistent structure
   candidates: analysis.candidates[0]
   
   // ✅ CORRECT - Handle both cases
   candidates: Array.isArray(analysis.candidates) && analysis.candidates.length > 0 
     ? analysis.candidates[0] 
     : (analysis.candidates && !Array.isArray(analysis.candidates)) 
       ? analysis.candidates 
       : null
   ```

2. **Interface Alignment**: Ensure function return types match interface expectations exactly
   - Read target interface BEFORE writing data transformation code
   - Test with actual database queries, not mocked data
   - Use type guards for union types

#### Unused Code Elimination Rules
1. **Variable Declaration Audit**: Before committing, check for unused:
   - State variables (`const [foo, setFoo] = useState()`)
   - Function parameters
   - Imported components/functions
   - Defined but uncalled functions

2. **Import Cleanup**: Remove unused imports immediately after refactoring
   ```typescript
   // ❌ WRONG - Importing unused components
   import { Alert, AlertDescription } from "@/components/ui/alert"
   
   // ✅ CORRECT - Only import what's used
   import { AlertCircle } from "lucide-react"
   ```

3. **State Management Hygiene**: 
   - Remove state that's only set but never read
   - Remove setters that are never called
   - Remove effect dependencies that don't affect the effect

#### Function Parameter Validation
1. **Required vs Optional**: Match interface definitions exactly
   ```typescript
   // ❌ WRONG - Parameter in function but not used
   function MyComponent({ jobId, existingAnalyses, jobData }: Props) {
   
   // ✅ CORRECT - Remove unused parameters
   function MyComponent({ jobId, existingAnalyses }: Props) {
   ```

2. **Error Handling Variables**: Only capture errors you actually handle
   ```typescript
   // ❌ WRONG - Error captured but ignored
   const { data, error: checkError } = await supabase.from()...
   
   // ✅ CORRECT - Don't capture unused errors
   const { data } = await supabase.from()...
   ```

### 🔧 Mandatory Pre-Commit Checklist

Run these checks EVERY time before committing:

1. **Build Verification**: `pnpm build` must pass with zero warnings
2. **ESLint Clean**: Address all linting warnings, especially:
   - `@typescript-eslint/no-unused-vars`
   - `@typescript-eslint/no-unused-imports`
3. **Type Safety Check**: Verify all property accesses match interfaces
4. **Database Query Validation**: Test actual database queries, not mock data

### 🎯 Code Quality Patterns

#### Type-Safe Database Queries
```typescript
// Pattern for handling Supabase joins that might return arrays
const transformAnalyses = (analyses: RawAnalysis[]) => {
  return analyses.map(analysis => ({
    ...analysis,
    candidates: normalizeToSingleObject(analysis.candidates)
  }))
}

const normalizeToSingleObject = (candidates: unknown) => {
  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates[0]
  }
  if (candidates && !Array.isArray(candidates)) {
    return candidates
  }
  return null
}
```

#### Unused Variable Prevention
```typescript
// ✅ GOOD - Destructure only what you need
const { data } = await supabase.from('table').select()

// ✅ GOOD - Use underscore for intentionally unused
const { data, error: _ } = await supabase.from('table').select()

// ❌ BAD - Capturing unused variables
const { data, error: unusedError } = await supabase.from('table').select()
```

### 🚫 Anti-Patterns to Avoid

1. **Blind Type Casting**: Never cast between unrelated types without validation
2. **Assumption-Based Property Access**: Always verify interface before accessing properties
3. **Leftover Development Code**: Remove debug variables and unused state after development
4. **Copy-Paste Type Errors**: When copying code, verify types match the new context

---

*This file serves as the single source of truth for development standards. Always reference these guidelines when making code changes.*