# Vita - Virtual Interface for Talent Acquisition
## Technical Implementation Details

This document provides a comprehensive overview of the Vita application's code structure, architecture, and functionality to help developers and AI tools understand how the application works.

## Project Overview

Vita is an AI-powered recruitment platform built with modern web technologies. The application revolves around the **Job** object, providing a suite of intelligent tools that automate recruiting workflows and deliver data-driven insights.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI Components**: ShadCN UI + Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: React Server Components + Server Actions
- **Form Validation**: Zod schemas

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR
- **File Storage**: Supabase Storage (resumes, avatars)
- **API Integration**: Multiple AI/LLM services
- **Edge Functions**: Vercel Edge Runtime

### Development
- **Package Manager**: pnpm (exclusively)
- **Deployment**: Vercel
- **Version Control**: Git
- **Development Server**: Port 3000

## Directory Structure

```
/
├── app/                         # Next.js App Router
│   ├── about/                   # Public about page
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── update-password/
│   ├── protected/               # Authenticated routes
│   │   ├── layout.tsx          # Protected layout wrapper
│   │   ├── layout-with-sidebar.tsx  # Sidebar navigation
│   │   ├── page.tsx            # Jobs dashboard
│   │   ├── candidates/         # Candidate management
│   │   │   ├── page.tsx        # Candidates list
│   │   │   └── [candidateId]/  # Candidate details
│   │   ├── companies/          # Company management
│   │   ├── jobs/               # Job-specific tools
│   │   │   └── [id]/           # Individual job pages
│   │   │       ├── page.tsx    # Job details
│   │   │       ├── job-description-builder/
│   │   │       ├── linkedin-query-builder/
│   │   │       ├── candidate-match-analysis/
│   │   │       ├── email-builder/
│   │   │       ├── interview-questions-generator/
│   │   │       └── interview-analysis/
│   │   └── settings/           # User settings
│   ├── api/                    # API routes
│   │   └── parse-resume/       # Resume parsing endpoint
│   ├── actions/                # Server actions
│   │   ├── candidates.ts       # Candidate CRUD operations
│   │   ├── companies.ts        # Company management
│   │   ├── jobs.ts            # Job operations
│   │   ├── job-management.ts  # Job-specific actions
│   │   ├── match-analysis.ts   # AI matching logic
│   │   └── profile.ts         # User profile actions
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/                 # React components
│   ├── ui/                    # ShadCN UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sidebar.tsx        # App sidebar
│   │   ├── toast.tsx          # Toast notifications
│   │   └── ...                # Other UI primitives
│   ├── candidate-match-analysis/  # Match analysis feature
│   │   ├── index.tsx
│   │   ├── analysis-card.tsx
│   │   ├── candidate-selection-form.tsx
│   │   ├── analysis-results-display.tsx
│   │   └── types.ts
│   ├── auth-button.tsx        # Authentication controls
│   ├── create-job-dialog.tsx  # Job creation wizard
│   ├── job-tools-grid.tsx     # Job tools navigation
│   ├── site-header.tsx        # App header
│   └── ...                    # Other components
├── lib/                       # Utilities and helpers
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth middleware
│   ├── api/                  # API integrations
│   │   └── linkedin-queries.ts
│   ├── constants/            # App constants
│   ├── helpers/              # Helper functions
│   ├── validations/          # Zod schemas
│   └── utils.ts              # Utility functions
├── hooks/                     # Custom React hooks
│   ├── use-auth-state.ts     # Auth state management
│   ├── use-mobile.ts         # Responsive detection
│   └── use-toast.ts          # Toast notifications
├── types/                     # TypeScript definitions
│   ├── database.types.ts     # Supabase schema types
│   ├── job.ts               # Job-related types
│   └── index.ts             # Common types
├── docs/                      # Documentation
│   ├── api/                  # API documentation
│   ├── db-schema/           # Database schema
│   └── patterns/            # Code patterns
├── supabase/                 # Supabase configuration
│   ├── migrations/          # Database migrations
│   └── config.toml          # Local config
├── public/                   # Static assets
├── middleware.ts            # Next.js middleware
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── components.json          # ShadCN UI config
└── package.json            # Dependencies
```

## Core Architecture

### Authentication Flow

1. **Middleware Protection** (`middleware.ts`):
   - Intercepts all requests to `/protected/*` routes
   - Validates authentication using Supabase session
   - Redirects unauthenticated users to login

2. **Session Management**:
   - Server-side: `lib/supabase/server.ts` with cookie management
   - Client-side: `lib/supabase/client.ts` for browser operations
   - Uses `@supabase/ssr` for secure cookie handling

3. **Auth Components**:
   - Login/signup forms with validation
   - Password reset flow
   - Session persistence across tabs

### Data Architecture

#### Primary Entities

1. **Jobs** (`jobs` table):
   - Core object with comprehensive attributes
   - Linked to companies, requirements, candidates
   - Supports multiple location types and pay structures

2. **Candidates** (`candidates` table):
   - Profile information and contact details
   - Skills tracking with proficiency levels
   - Resume storage and LinkedIn data
   - Source tracking (LinkedIn/Resume/Manual)

3. **Companies** (`companies` table):
   - Reusable across multiple jobs
   - Industry classification
   - Contact and website information

4. **Match Analysis** (`job_candidate_match_analysis` table):
   - AI-generated matching scores
   - Requirement-by-requirement evaluation
   - Recommendations and feedback storage

#### Supporting Tables
- **Lookup Tables**: 15+ tables for countries, industries, skills, etc.
- **Job Requirements**: Detailed skill/experience requirements
- **Candidate Skills**: Skill proficiency and experience tracking
- **Interview Data**: Questions, transcripts, evaluations

### AI Integration Architecture

#### Job Description Builder
1. **Input**: Raw notes from client conversations
2. **Processing**: 
   - Extract job details via AI API
   - Structure requirements and attributes
   - Generate professional description
3. **Output**: Formatted job description with copy functionality

#### LinkedIn Query Builder
1. **Input**: Job requirements and preferences
2. **Processing**: AI generates Boolean search strings
3. **Output**: Multiple query variations for comprehensive search

#### Candidate Match Analysis
1. **Input Sources**:
   - LinkedIn URL → Apify scraper → Profile reducer → Skill parser
   - PDF Resume → OCR/parsing → Skill extraction
   - Manual candidate entry
2. **Matching Algorithm**:
   - Requirement-by-requirement scoring
   - Weighted importance calculation
   - Status classification (Strong/Adequate/Weak/Missing)
3. **Output**: Comprehensive analysis report with recommendations

### Component Architecture

#### Layout Structure
- **Root Layout** (`app/layout.tsx`): Theme provider, fonts, toaster
- **Protected Layout**: Authentication wrapper
- **Sidebar Layout**: Navigation for authenticated users
- **Page Layouts**: Tool-specific layouts with breadcrumbs

#### Component Patterns
1. **Server Components** (default):
   - Data fetching and rendering
   - SEO optimization
   - Reduced client bundle

2. **Client Components** (marked with 'use client'):
   - Interactive elements
   - Form handling
   - Real-time updates

3. **Server Actions**:
   - Form submissions
   - Database mutations
   - File uploads

#### UI Component System
- **Base**: ShadCN UI components built on Radix
- **Styling**: Tailwind utilities with CSS variables
- **Themes**: Light/dark mode with system detection
- **Icons**: Lucide React icon library

### State Management

1. **Server State**:
   - React Server Components for initial data
   - Server Actions for mutations
   - Automatic revalidation

2. **Client State**:
   - React hooks for local state
   - Form state with react-hook-form
   - Optimistic updates where appropriate

3. **Global State**:
   - Authentication state via context
   - Theme state via next-themes
   - Toast notifications via global provider

## Key Features Implementation

### Job Management
- **Creation**: Multi-step wizard with validation
- **Editing**: In-place editing with auto-save
- **Requirements**: Dynamic skill/requirement management
- **Status Tracking**: Active/archived states

### Candidate Management
- **Import**: LinkedIn scraping or resume upload
- **Profile Creation**: Automatic skill extraction
- **Search/Filter**: By skills, experience, location
- **Bulk Operations**: Multi-select actions

### AI-Powered Tools
1. **Job Description Builder**:
   - Natural language processing
   - Consistent formatting
   - Industry-specific language

2. **Match Analysis**:
   - Multi-factor scoring
   - Gap analysis
   - Strategic recommendations

3. **LinkedIn Integration**:
   - Profile scraping via Apify
   - Structured data extraction
   - Skill normalization

### File Management
- **Resume Upload**: Drag-and-drop with validation
- **Temporary Storage**: For processing
- **Permanent Storage**: Linked to candidates
- **Avatar Management**: User profile pictures

## Security Implementation

### Authentication
- Supabase Auth with email/password
- Session-based authentication
- Secure cookie management
- Password reset flow

### Authorization
- Row Level Security (RLS) policies
- User data isolation
- Role-based access (future)

### Data Protection
- Input validation with Zod
- SQL injection prevention
- XSS protection
- CSRF protection via SameSite cookies

## Performance Optimizations

### Frontend
- React Server Components by default
- Code splitting at route level
- Image optimization with Next.js
- Lazy loading for heavy components

### Backend
- Efficient database queries
- Proper indexing strategy
- Connection pooling
- Edge function deployment

### Caching
- Static asset caching
- API response caching
- User-specific cache isolation
- Cache invalidation on updates

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI APIs
OPENAI_API_KEY=
APIFY_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=
```

### Database Migrations
- Located in `supabase/migrations/`
- Run via Supabase CLI
- Version controlled
- RLS policies included

## Testing Strategy

### Type Safety
- TypeScript strict mode
- Comprehensive type definitions
- Runtime validation with Zod

### Manual Testing
- Multi-user scenarios
- Cross-browser compatibility
- Mobile responsiveness
- Error scenarios

### Future Testing
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright
- Performance testing

## Deployment

### Production Environment
- Hosted on Vercel
- Edge functions for API routes
- Automatic deployments from main branch
- Environment variable management

### Monitoring
- Error tracking (to be implemented)
- Performance monitoring
- User analytics (privacy-first)
- Database metrics via Supabase

## API Documentation

### External APIs
1. **OpenAI**: Text generation and analysis
2. **Apify**: LinkedIn profile scraping
3. **Custom AI APIs**: Job-specific processing

### Internal APIs
- Server Actions for data mutations
- API routes for file processing
- Edge functions for performance

## Common Patterns

### Form Handling
```typescript
// Server Action pattern
export async function createJob(formData: FormData) {
  'use server'
  // Validation
  // Database operation
  // Revalidation
}
```

### Data Fetching
```typescript
// Server Component pattern
export default async function JobsPage() {
  const supabase = createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
  
  return <JobsList jobs={jobs} />
}
```

### Error Handling
- Try-catch blocks in Server Actions
- Error boundaries for UI errors
- Toast notifications for user feedback
- Graceful degradation

## Troubleshooting

### Common Issues
1. **Auth Issues**: Check Supabase configuration
2. **Type Errors**: Regenerate database types
3. **Build Errors**: Clear .next directory
4. **API Errors**: Verify environment variables

### Debug Tools
- Browser DevTools
- Supabase Dashboard
- Vercel Functions logs
- TypeScript compiler

---

*This documentation reflects the current implementation as of January 2025.*