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
- `@docs/db-schema/supabase-db-schema.csv` - Current schema
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
- ❌ Generic cache keys that could cause user data collisions
- ❌ Missing `noStore()` on user-specific pages
- ❌ Exposing secrets in client-side code
- ❌ Bypassing RLS policies for data access
- ❌ Code duplication instead of modular, reusable patterns

---

*This file serves as the single source of truth for development standards. Always reference these guidelines when making code changes.*