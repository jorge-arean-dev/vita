# Prompt Suggestions for AI Development

This document contains efficient prompts to reference when working with AI assistants on specific aspects of the codebase.

## Font System Modifications

### Prompt for Safe Font Changes

Use this prompt when you need to modify fonts in the application:

```
I need to modify the fonts in my Next.js application. Before making any changes, please review the current font architecture by examining these files:

@components/ui/font-provider.tsx - Current font configuration
@app/globals.css - CSS font rules and portal targeting
@docs/recommendations/font-provider-common-issues.md - Font best practices guide

Requirements:
1. Maintain the existing CSS variable system (--font-titles, --font-text, --font-mono)
2. Preserve portal element targeting for Radix UI components
3. Keep the centralized font management approach
4. Ensure all font changes are applied through the FontProvider component
5. Do not modify individual component font styles directly
6. Respect the semantic font hierarchy (titles vs text vs monospace)

Task: [Specify your font change request here]

Please explain your approach before implementing and confirm that the changes won't break portal element font inheritance.
```

### Key Files to Reference for Font Work:
- `@components/ui/font-provider.tsx` - Main font configuration
- `@app/globals.css` - Global styles and portal targeting
- `@docs/recommendations/font-provider-common-issues.md` - Best practices guide
- `@app/layout.tsx` - Font provider integration

## Component Development

### Prompt for New Component Creation

Use this prompt when creating new components:

```
I need to create a new component for my Next.js application. Please review the existing patterns first:

@docs/rules/coding.md - Coding guidelines and conventions
@components/ui/ - Review existing component patterns
@app/globals.css - Check current styling approach

Requirements:
1. Follow existing naming conventions (lowercase with dashes for files)
2. Use TypeScript with proper interfaces
3. Follow the established component structure pattern
4. Inherit fonts from globals.css (no hardcoded font styles)
5. Use Shadcn UI components where appropriate
6. Ensure mobile responsiveness
7. Follow accessibility best practices

Task: [Specify your component requirements here]

Please show me the component structure and explain how it follows the existing patterns before implementation.
```

### Key Files to Reference for Component Work:
- `@docs/rules/coding.md` - Development guidelines
- `@components/ui/` - Component library patterns
- `@app/globals.css` - Global styling approach
- `@components.json` - Shadcn UI configuration

## Database Schema Modifications

### Prompt for Database Changes

Use this prompt when modifying database schema:

```
I need to modify the database schema for my Supabase application. Please review the current structure first:

@docs/db-schema/db_schema.json - Current database schema
@docs/rules/supabase-guide.md - Supabase best practices
@supabase/migrations/ - Review existing migration patterns

Requirements:
1. Follow existing naming conventions
2. Maintain referential integrity
3. Include proper RLS (Row Level Security) policies
4. Follow the established migration file naming pattern
5. Update TypeScript types if needed
6. Consider performance implications

Task: [Specify your database change request here]

Please create a migration plan and explain how it maintains data integrity before implementation.
```

### Key Files to Reference for Database Work:
- `@docs/db-schema/db_schema.json` - Current schema
- `@docs/rules/supabase-guide.md` - Database guidelines
- `@supabase/migrations/` - Migration patterns
- `@types/database.types.ts` - TypeScript definitions

## Styling and Layout Changes

### Prompt for Styling Modifications

Use this prompt when making styling changes:

```
I need to modify the styling in my Next.js application. Please review the current styling approach:

@app/globals.css - Global styles and CSS variables
@tailwind.config.ts - Tailwind configuration
@docs/rules/coding.md - Styling guidelines

Requirements:
1. Use existing CSS variables from globals.css
2. Follow mobile-first responsive design
3. Maintain consistency with existing components
4. Use Tailwind classes over custom CSS when possible
5. Support both light and dark themes
6. Ensure accessibility compliance
7. Don't break font inheritance for portal elements

Task: [Specify your styling requirements here]

Please explain your approach and show how it integrates with the existing design system.
```

### Key Files to Reference for Styling Work:
- `@app/globals.css` - Global styles and variables
- `@tailwind.config.ts` - Tailwind configuration
- `@docs/rules/coding.md` - Styling guidelines
- `@components/ui/` - Component styling patterns

## Authentication and Security

### Prompt for Auth-Related Changes

Use this prompt when working with authentication:

```
I need to modify authentication functionality in my Next.js + Supabase application. Please review the current auth setup:

@docs/rules/supabase-guide.md - Supabase security guidelines
@lib/supabase/ - Client and server configurations
@middleware.ts - Auth middleware
@hooks/use-auth-state.ts - Auth state management

Requirements:
1. Follow RLS (Row Level Security) best practices
2. Maintain separation between client and server auth
3. Ensure proper session management
4. Follow established error handling patterns
5. Maintain security best practices
6. Test both authenticated and unauthenticated states

Task: [Specify your auth-related request here]

Please explain the security implications and show how the changes maintain proper auth flow.
```

### Key Files to Reference for Auth Work:
- `@docs/rules/supabase-guide.md` - Security guidelines
- `@lib/supabase/` - Auth configuration
- `@middleware.ts` - Route protection
- `@hooks/use-auth-state.ts` - State management

## General Development Guidelines

### Universal Prompt Template

```
I need to work on [SPECIFIC TASK] in my Next.js application. Please first review the relevant files and guidelines:

@docs/rules/coding.md - General coding guidelines
@docs/recommendations/ - Check for relevant best practices guides
[Add specific files related to your task]

Requirements:
1. Follow existing code patterns and conventions
2. Maintain TypeScript strict typing
3. Ensure mobile responsiveness
4. Follow accessibility best practices
5. Test the implementation thoroughly
6. Don't break existing functionality

Task: [Detailed task description]

Please review the current implementation and explain your approach before making changes.
```

## Tips for Effective AI Prompts

1. **Always reference relevant files** - Use the @ symbol to specify files
2. **Review before implementation** - Ask AI to explain approach first
3. **Specify constraints** - Mention what should NOT be changed
4. **Include context** - Reference related documentation and guidelines
5. **Ask for explanations** - Understand the reasoning behind changes
6. **Test thoroughly** - Request testing steps and considerations
7. **Maintain consistency** - Ensure changes follow existing patterns

## Common Anti-Patterns to Avoid

When prompting AI assistants, avoid these requests:

- ❌ "Change all fonts in the app" (without referencing the font system)
- ❌ "Add inline styles to components" (breaks the CSS variable system)
- ❌ "Modify database directly" (without migrations)
- ❌ "Override component styles" (without understanding the design system)
- ❌ "Add authentication" (without reviewing existing auth patterns)

Instead, always reference the appropriate files and guidelines to ensure changes are made correctly and consistently.