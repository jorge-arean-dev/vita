# Vita - Virtual Interface for Talent Acquisition
## Technical Implementation Details

This document provides a comprehensive overview of the Vita application's code structure, architecture, and functionality to help developers and AI tools understand how the application works.

*Last updated: August 2025*

## Project Overview

Vita is an AI-powered recruitment platform built with modern web technologies. The application provides intelligent recruiting tools focused around job management, candidate analysis, interview automation, and communication workflows. The platform integrates with various AI services and external APIs to deliver data-driven recruiting insights.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with Turbopack
- **Language**: TypeScript (Strict Mode)
- **UI Components**: ShadCN UI + Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables and dark mode support
- **State Management**: React Server Components + Server Actions
- **Form Validation**: Zod schemas
- **Fonts**: Custom font provider system with portal support

### Backend
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with SSR (@supabase/ssr)
- **File Storage**: Supabase Storage (resumes, avatars, temp files)
- **API Integration**: OpenAI, Recall.ai, Apify LinkedIn scraper
- **Edge Functions**: Supabase Edge Functions + Vercel Edge Runtime
- **Webhooks**: Recall.ai webhook integration with Svix verification

### Development
- **Package Manager**: pnpm (exclusively)
- **Deployment**: Vercel with automatic deployments
- **Version Control**: Git with structured migrations
- **Development Server**: Port 3000 with Turbopack

## Directory Structure

```
/
├── app/                         # Next.js App Router
│   ├── about/                   # Public about page
│   ├── faq/                    # Public FAQ page
│   ├── landing-v1/             # Enhanced landing page
│   │   ├── page.tsx           # Main landing with video background
│   │   ├── layout.tsx         # Landing-specific layout
│   │   └── styles/            # Style utilities
│   ├── styles/                 # Style customization pages
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── sign-up-success/
│   │   ├── forgot-password/
│   │   ├── update-password/
│   │   ├── confirm/            # Email confirmation
│   │   └── error/             # Auth error handling
│   ├── protected/              # Authenticated routes
│   │   ├── layout.tsx         # Protected layout wrapper
│   │   ├── layout-with-sidebar.tsx  # Sidebar navigation
│   │   ├── page.tsx           # Jobs dashboard
│   │   ├── candidates/        # Candidate management
│   │   │   ├── page.tsx       # Candidates list
│   │   │   └── [candidateId]/ # Candidate details
│   │   ├── companies/         # Company management
│   │   ├── jobs/              # Job-specific tools
│   │   │   └── [id]/          # Individual job pages
│   │   │       ├── page.tsx   # Job details
│   │   │       ├── job-description-builder/
│   │   │       ├── linkedin-query-builder/
│   │   │       ├── candidate-match-analysis/
│   │   │       ├── email-builder/         # Enhanced email builder
│   │   │       ├── interview-questions-generator/
│   │   │       ├── interview-analysis/
│   │   │       └── interview-companion/   # NEW: AI interview companion
│   │   └── settings/          # User settings with avatar/profile forms
│   ├── api/                   # API routes
│   │   ├── parse-resume/      # Resume parsing endpoint
│   │   └── recall/            # NEW: Recall.ai integration
│   │       └── webhooks/      # Webhook handlers for interviews
│   ├── actions/               # Server actions
│   │   ├── candidates.ts      # Candidate CRUD operations
│   │   ├── companies.ts       # Company management
│   │   ├── jobs.ts           # Job operations
│   │   ├── job-management.ts # Job-specific actions
│   │   ├── match-analysis.ts # AI matching logic
│   │   ├── profile.ts        # User profile actions
│   │   ├── email-builder.ts  # NEW: Enhanced email generation
│   │   ├── interviews.ts     # NEW: Interview management & analysis
│   │   ├── interview-questions.ts # Interview question generation
│   │   └── waitlist.ts       # NEW: Landing page waitlist forms
│   ├── globals.css           # Global styles with portal targeting
│   ├── layout.tsx            # Root layout with font provider
│   └── page.tsx              # Main landing page
├── components/                 # React components
│   ├── ui/                    # ShadCN UI components (60+ components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sidebar.tsx        # App sidebar with user info
│   │   ├── toast.tsx          # ShadCN toast system (NOT Sonner)
│   │   ├── font-provider.tsx  # Font management system
│   │   ├── skill-badge.tsx    # Custom skill display
│   │   └── ...                # All ShadCN UI primitives
│   ├── candidate-match-analysis/  # Enhanced match analysis
│   │   ├── index.tsx
│   │   ├── analysis-card.tsx
│   │   ├── candidate-selection-form.tsx
│   │   ├── analysis-results-display.tsx
│   │   ├── hooks/             # Custom hooks for animations & logic
│   │   ├── types.ts
│   │   └── utils.tsx
│   ├── email-builder/         # NEW: Enhanced email builder
│   │   ├── index.tsx          # Main email builder interface
│   │   ├── components/        # Email UI components
│   │   ├── hooks/             # Email generation & persistence hooks
│   │   ├── tabs/              # Candidate & client email tabs
│   │   ├── types/             # Email builder types
│   │   └── utils/             # Email utilities
│   ├── interview-companion/   # NEW: AI interview companion
│   │   ├── index.tsx          # Main interview interface
│   │   ├── create-interview-dialog.tsx
│   │   ├── interview-transcript.tsx
│   │   ├── interview-analysis.tsx
│   │   └── candidate-combobox.tsx
│   ├── create-talent-dialog/  # Enhanced candidate creation
│   │   ├── index.tsx
│   │   ├── components/        # Multi-step form components
│   │   ├── hooks/             # LinkedIn & resume processing
│   │   ├── types/
│   │   └── utils/
│   ├── landing-v1/           # NEW: Enhanced landing page
│   │   ├── landing-header.tsx
│   │   ├── landing-hero.tsx
│   │   ├── landing-footer.tsx
│   │   ├── join-waitlist-dialog.tsx # Waitlist form
│   │   ├── about-section.tsx
│   │   ├── how-section.tsx
│   │   └── plans-section.tsx
│   ├── styles/               # NEW: Style customization components
│   │   ├── color-palette.tsx
│   │   ├── typography-settings.tsx
│   │   └── spacing-settings.tsx
│   ├── backup-old-phases/    # Legacy job phase components
│   ├── auth-button.tsx       # Authentication controls
│   ├── create-job-dialog.tsx # Job creation wizard
│   ├── job-tools-grid.tsx    # Job tools navigation
│   ├── site-header.tsx       # App header
│   ├── jobs-table.tsx        # Job listing table
│   └── ...                   # 100+ other components
├── lib/                       # Utilities and helpers
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth middleware
│   ├── api/                  # API integrations
│   │   ├── linkedin-queries.ts
│   │   └── recall.ts         # NEW: Recall.ai API client
│   ├── constants/            # App constants
│   │   ├── breadcrumbs.ts
│   │   └── job.ts
│   ├── helpers/              # Helper functions
│   │   └── job.ts
│   ├── validations/          # Zod schemas
│   │   └── job.ts
│   ├── cache.ts              # NEW: User cache isolation
│   ├── logging.ts            # NEW: Structured logging
│   ├── monitoring.ts         # NEW: Performance monitoring
│   └── utils.ts              # Utility functions
├── hooks/                     # Custom React hooks
│   ├── use-auth-state.ts     # Auth state management
│   ├── use-mobile.ts         # Responsive detection
│   ├── use-avatar.ts         # NEW: Avatar management
│   └── use-copy-to-clipboard.ts # NEW: Copy functionality
├── types/                     # TypeScript definitions
│   ├── database.types.ts     # Supabase schema types
│   ├── job.ts               # Job-related types
│   ├── interview.types.ts   # NEW: Interview types
│   ├── profile.types.ts     # NEW: Profile types
│   └── index.ts             # Common types
├── contexts/                 # React contexts
│   └── typography-context.tsx # NEW: Font context
├── docs/                     # Comprehensive documentation
│   ├── apis/                # API integration docs
│   │   ├── code/            # API implementation code
│   │   └── docs/            # API documentation
│   ├── db-schema/           # Database schema & data
│   ├── features/            # Feature specifications
│   ├── landing-page/        # Landing page documentation
│   ├── patterns/            # Code patterns & best practices
│   ├── recommendations/     # Architecture recommendations
│   ├── rules/               # Development rules
│   └── additional-docs/     # Legacy & reference materials
├── supabase/                 # Supabase configuration
│   ├── migrations/          # 40+ database migrations
│   ├── manual_migrations/   # Manual migration scripts
│   └── config.toml          # Local config
├── public/                   # Static assets
│   ├── logo/                # Vita logos (light/dark)
│   └── background/          # Background images
├── mockups/                  # NEW: UI/UX mockups
├── middleware.ts            # Next.js middleware with auth
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── components.json          # ShadCN UI config
├── eslint.config.mjs        # ESLint configuration
└── package.json            # Dependencies with latest versions
```

## Core Architecture

### Authentication Flow

1. **Middleware Protection** (`middleware.ts`):
   - Intercepts all requests to `/protected/*` routes
   - Validates authentication using Supabase session
   - Implements user cache isolation for SaaS security
   - Redirects unauthenticated users to login

2. **Session Management**:
   - Server-side: `lib/supabase/server.ts` with secure cookie management
   - Client-side: `lib/supabase/client.ts` for browser operations
   - Uses `@supabase/ssr` with `getAll`/`setAll` cookie patterns (NEVER use deprecated `get`/`set`)
   - Enhanced logout with cache clearing and hard navigation

3. **Auth Components**:
   - Login/signup forms with comprehensive validation
   - Password reset flow with email confirmation
   - Email verification system
   - Session persistence across tabs
   - Auth state provider with global state management

### Data Architecture

The database schema has evolved significantly with 40+ migrations and now includes comprehensive recruiting workflow support.

#### Primary Entities

1. **Jobs** (`jobs` table):
   - Core object with comprehensive attributes
   - Enhanced with job descriptions and LinkedIn queries tables
   - Linked to companies, requirements, candidates
   - Supports multiple location types and pay structures

2. **Candidates** (`candidates` table):
   - Profile information and contact details
   - Skills tracking with proficiency levels and years of experience
   - Resume storage and LinkedIn data integration
   - GitHub profile support
   - Source tracking (LinkedIn/Resume/Manual/User Input)

3. **Companies** (`companies` table):
   - Reusable across multiple jobs
   - Industry classification with detailed taxonomy
   - Contact and website information
   - Enhanced profile fields

4. **Match Analysis** (`job_candidate_match_analysis` table):
   - AI-generated matching scores
   - Requirement-by-requirement evaluation
   - Enhanced analysis with structured results
   - Recommendations and feedback storage

5. **Interviews** (`interviews` table) - NEW:
   - Interview session management
   - Recall.ai bot integration
   - Status tracking (created, in_progress, ready_for_analysis, analyzing, completed)
   - Meeting link storage and candidate association

6. **Email Builder** (`job_email_builder`, `email_builder_templates`, `email_types`) - NEW:
   - Template-based email generation
   - Candidate and client email types
   - Saved email management
   - AI-powered content generation

7. **Waitlist Forms** (`waitlist_forms`) - NEW:
   - Landing page form submissions
   - Country validation and industry tracking
   - Tools and AI tools preferences

#### Supporting Tables
- **Lookup Tables**: 20+ tables for countries, industries, skills, timezones, etc.
- **Job Requirements**: Detailed skill/experience requirements with weights
- **Candidate Skills**: Skill proficiency and experience tracking with decimal precision
- **Interview Data**: 
  - `interview_transcripts`: Segment-based transcript storage
  - `interview_scores`: AI-powered interview analysis
  - `interview_statuses`: Status lookup with descriptions
- **Profile Management**: Enhanced user profiles with avatar support

### AI Integration Architecture

The application integrates multiple AI services and APIs for intelligent recruiting automation.

#### Job Description Builder
1. **Input**: Raw notes from client conversations or existing descriptions
2. **Processing**: 
   - Extract job details via Supabase Edge Functions
   - Structure requirements and attributes using AI
   - Generate professional descriptions with industry-specific language
3. **Output**: Formatted job description with copy functionality and storage

#### LinkedIn Query Builder
1. **Input**: Job requirements, skills, and preferences
2. **Processing**: AI generates Boolean search strings optimized for LinkedIn
3. **Output**: Multiple query variations for comprehensive search with copy functionality

#### Enhanced Email Builder - NEW
1. **Input Sources**:
   - Job information (title, requirements, company)
   - Candidate information (name, skills, location)
   - User profile (sender information)
   - Email templates (candidate/client types)
2. **Processing**:
   - Supabase Edge Function integration
   - AI-powered content generation
   - Template-based personalization
3. **Output**: Professional emails with copy functionality and database persistence

#### Interview Companion - NEW
1. **Interview Management**:
   - Google Meet integration via Recall.ai
   - Real-time bot deployment and monitoring
   - Webhook-based status updates
2. **Transcript Processing**:
   - Real-time transcription via Recall.ai
   - Structured transcript storage (JSONB + segments)
   - Speaker identification and timing
3. **Interview Analysis**:
   - AI-powered scoring (0-4 scale)
   - Strengths and improvement areas identification
   - Key moments extraction with timestamps
   - Recommendation generation

#### Candidate Match Analysis - Enhanced
1. **Input Sources**:
   - LinkedIn URL → Apify scraper → Profile reducer → Skill parser
   - PDF Resume → OCR/parsing → Enhanced skill extraction
   - Manual candidate entry with validation
2. **Matching Algorithm**:
   - Requirement-by-requirement scoring
   - Weighted importance calculation
   - Status classification (Strong/Adequate/Weak/Missing)
   - Experience level matching
3. **Output**: Comprehensive analysis report with visual progress indicators

### Component Architecture

#### Layout Structure
- **Root Layout** (`app/layout.tsx`): Font provider, theme provider, toast system
- **Protected Layout**: Authentication wrapper with user cache isolation
- **Sidebar Layout**: Enhanced navigation with user avatar and role information
- **Page Layouts**: Tool-specific layouts with breadcrumbs and loading states
- **Landing Layout**: Specialized layout for public marketing pages

#### Component Patterns
1. **Server Components** (default):
   - Data fetching and rendering with `noStore()` for user-specific content
   - SEO optimization
   - Reduced client bundle size

2. **Client Components** (marked with 'use client'):
   - Interactive elements with proper state management
   - Form handling with validation
   - Real-time updates and animations

3. **Server Actions**:
   - Form submissions with comprehensive validation
   - Database mutations with RLS enforcement
   - File uploads to Supabase Storage
   - API integrations (Recall.ai, email generation)

#### UI Component System
- **Base**: 60+ ShadCN UI components built on Radix primitives
- **Styling**: Tailwind utilities with CSS variables and dark mode
- **Font System**: Centralized FontProvider with portal element targeting
- **Themes**: Light/dark mode with system detection and persistence
- **Icons**: Lucide React icon library (500+ icons)
- **Toast System**: ShadCN toast implementation (NOT Sonner) with proper error handling

#### Critical UI Patterns
1. **Font Management**:
   - Centralized via `FontProvider` component
   - CSS variables: `--font-titles`, `--font-text`, `--font-mono`
   - Portal targeting for Radix components in overlays

2. **Form Architecture**:
   - React Hook Form with Zod validation
   - Server Action integration
   - Error handling with toast notifications
   - Multi-step forms with progress indicators

3. **Data Loading**:
   - Suspense boundaries with skeleton states
   - Error boundaries for graceful error handling
   - Optimistic updates for better UX

### State Management

1. **Server State**:
   - React Server Components for initial data fetching
   - Server Actions for mutations with revalidation
   - User cache isolation with `noStore()` for SaaS security
   - Automatic revalidation with `revalidatePath()`

2. **Client State**:
   - React hooks for local component state
   - Form state with react-hook-form and Zod validation
   - Optimistic updates for better user experience
   - Custom hooks for complex state logic (animations, data fetching)

3. **Global State**:
   - Authentication state via `AuthStateProvider`
   - Theme state via next-themes with persistence
   - Font management via `TypographyContext`
   - Toast notifications via ShadCN toast system

## New Feature Implementations

### Interview Companion System

The Interview Companion is a comprehensive AI-powered interview management system that integrates with Recall.ai for Google Meet recording and analysis.

#### Architecture
1. **Interview Creation**:
   - Multi-step dialog with candidate selection
   - Google Meet link validation (MVP restriction)
   - Recall.ai bot deployment with webhook configuration

2. **Real-time Processing**:
   - Webhook integration with Svix signature verification
   - Status tracking: created → in_progress → ready_for_analysis → analyzing → completed
   - Auto-refresh UI for live status updates

3. **Analysis Pipeline**:
   - Transcript retrieval via Recall.ai API
   - AI-powered scoring on 4-point scale
   - Strengths/weaknesses identification
   - Key moments extraction with timestamps

#### Key Files
- `app/actions/interviews.ts`: Core interview management logic
- `app/api/recall/webhooks/route.ts`: Webhook handler
- `lib/api/recall.ts`: Recall.ai API client
- `components/interview-companion/`: UI components
- `types/interview.types.ts`: TypeScript definitions

### Enhanced Email Builder

The Email Builder provides template-based, AI-powered email generation for candidate and client communications.

#### Features
1. **Template System**:
   - Predefined templates for various scenarios
   - Candidate vs. client email types
   - Custom prompt support

2. **AI Integration**:
   - Context-aware content generation
   - Job and candidate information integration
   - Personalization based on user profile

3. **Email Management**:
   - Save/load functionality
   - Email history tracking
   - Copy functionality for external use

#### Key Files
- `app/actions/email-builder.ts`: Email generation and persistence
- `components/email-builder/`: Modular UI components
- Database tables: `email_builder_templates`, `job_email_builder`, `email_types`

### Landing Page & Waitlist System

Enhanced marketing presence with video background and comprehensive waitlist capture.

#### Features
1. **Video Background Landing**:
   - Full-screen video background
   - Responsive design with mobile optimization
   - Multiple call-to-action sections

2. **Waitlist Form**:
   - Multi-field form with validation
   - Country integration with database
   - Tools and AI tools preferences
   - Trigger source tracking

#### Key Files
- `app/landing-v1/`: Landing page implementation
- `components/landing-v1/`: Landing page components
- `app/actions/waitlist.ts`: Form processing
- Database table: `waitlist_forms`

## Key Features Implementation

### Job Management - Enhanced
- **Creation**: Multi-step wizard with enhanced validation
- **Editing**: In-place editing with auto-save and unsaved changes protection
- **Requirements**: Dynamic skill/requirement management with proficiency levels
- **Status Tracking**: Active/archived states with comprehensive metadata
- **Tools Integration**: 8 specialized tools per job (description builder, LinkedIn queries, match analysis, email builder, interview companion, etc.)

### Candidate Management - Enhanced
- **Import**: Multi-source import (LinkedIn scraping, resume upload, manual entry)
- **Profile Creation**: AI-powered skill extraction with experience levels
- **Search/Filter**: Advanced filtering by skills, experience, location, source
- **GitHub Integration**: Developer profile support
- **Years of Experience**: Decimal precision tracking per skill

### AI-Powered Tools - Expanded
1. **Job Description Builder**:
   - Natural language processing via Supabase Edge Functions
   - Consistent formatting with copy functionality
   - Industry-specific language and terminology

2. **Enhanced Match Analysis**:
   - Multi-factor scoring with visual progress indicators
   - Detailed gap analysis with recommendations
   - Requirement-by-requirement evaluation
   - Experience level matching

3. **LinkedIn Integration**:
   - Profile scraping via Apify with rate limiting
   - Structured data extraction and normalization
   - Skill categorization and proficiency inference

4. **Interview Companion** - NEW:
   - Google Meet bot deployment
   - Real-time transcription and analysis
   - AI-powered interview scoring
   - Automated report generation

5. **Email Builder** - NEW:
   - Template-based email generation
   - AI-powered personalization
   - Candidate and client communication types
   - Email history and management

### File Management - Enhanced
- **Resume Upload**: Drag-and-drop with comprehensive validation
- **Temporary Storage**: Separate bucket for processing with automatic cleanup
- **Permanent Storage**: Linked to candidates with RLS security
- **Avatar Management**: User profile pictures with resize and optimization
- **Multiple Buckets**: Organized storage (avatars, resumes, temp-resumes)

## Security Implementation

### Authentication - Enhanced
- Supabase Auth with email/password and email verification
- Session-based authentication with SSR support
- Secure cookie management using `@supabase/ssr` with `getAll`/`setAll` patterns
- Comprehensive password reset and email confirmation flow
- Auth state provider with global session management

### Authorization - Comprehensive
- Row Level Security (RLS) policies on all tables (40+ policies)
- User data isolation with service role bypass for webhooks
- User-specific cache isolation for SaaS security
- Protected route middleware with automatic redirects
- Webhook authentication with Svix signature verification

### Data Protection - Advanced
- Input validation with Zod schemas across all forms
- SQL injection prevention via Supabase RLS
- XSS protection through input sanitization
- CSRF protection via SameSite cookies
- Environment variable security (no secrets in browser)
- User cache isolation preventing data leakage

### SaaS Security Features
- `noStore()` implementation for user-specific pages
- User-specific cache keys: `cache_${userId}_${resource}`
- Enhanced logout with cache clearing and hard navigation
- Webhook RLS bypass using service role for system operations

## API Integrations

### Recall.ai Integration
**Purpose**: Google Meet interview recording and transcription
- **Authentication**: API key-based with environment variable storage
- **Webhook Integration**: Svix signature verification for security
- **Bot Management**: Automatic deployment and status tracking
- **Transcript Processing**: Real-time retrieval and structured storage
- **Error Handling**: Comprehensive error handling with fallback scenarios

**Key Endpoints**:
- Bot creation: `POST /bot/`
- Bot status: `GET /bot/{id}/`
- Transcript retrieval: `GET /transcript/{id}/`

### Apify LinkedIn Scraper
**Purpose**: LinkedIn profile data extraction
- **Rate Limiting**: Implemented to avoid LinkedIn blocking
- **Data Processing**: Profile reduction and skill extraction
- **Error Handling**: Graceful degradation when scraping fails
- **Cache Management**: Efficient data storage and retrieval

### OpenAI Integration
**Purpose**: AI-powered content generation
- **Job Descriptions**: Professional description generation
- **Email Content**: Personalized communication templates
- **Match Analysis**: Candidate evaluation and scoring
- **Interview Analysis**: Automated interview assessment

### Supabase Edge Functions
**Purpose**: Server-side AI processing
- **Email Builder**: Template-based email generation
- **Job Analysis**: Requirement extraction and structuring
- **Security**: Server-side processing for sensitive operations

## Performance Optimizations

### Frontend - Enhanced
- React Server Components by default with selective client components
- Turbopack for faster development builds
- Image optimization with Next.js Image component
- Lazy loading for heavy components and routes
- Component-level code splitting with dynamic imports
- Font optimization with custom FontProvider system
- Skeleton states for improved perceived performance

### Backend - Advanced
- Efficient database queries with proper indexing (40+ indexes)
- Connection pooling via Supabase
- Edge function deployment on Vercel and Supabase
- Database query optimization with selective data fetching
- RLS policy optimization for performance
- Batch operations for bulk data processing

### Caching - SaaS-Optimized
- Static asset caching with Vercel CDN
- User-specific cache isolation preventing data leakage
- Cache invalidation on updates with `revalidatePath()`
- Service Worker caching for offline functionality
- API response caching with user-specific keys
- Browser storage management with enhanced logout

### Database Performance
- Comprehensive indexing strategy:
  - User ID indexes on all user-owned tables
  - Composite indexes for complex queries
  - Foreign key indexes for join optimization
- Query optimization:
  - Selective column fetching
  - Proper use of `single()` vs array operations
  - Efficient pagination with cursor-based pagination

## Development Workflow - Enhanced

### Local Development
```bash
# Install dependencies with pnpm
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint
```

### Environment Variables - Comprehensive
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # For webhook operations

# AI APIs
OPENAI_API_KEY=
APIFY_API_KEY=

# Recall.ai Integration
RECALL_API_KEY=
RECALL_WEBHOOK_SECRET=
RECALL_WEBHOOK_URL=

# App Configuration
NEXT_PUBLIC_APP_URL=
NEXTAUTH_URL=
NEXT_PUBLIC_VERCEL_URL=
```

### Database Migrations - Structured
- **40+ migrations** in chronological order
- **Version-controlled** schema changes
- **RLS policies** included in migrations
- **Data seeding** for lookup tables
- **Manual migrations** for complex operations
- **Migration naming**: `YYYYMMDD_HHMMSS_description.sql`

### Code Quality Standards
- **TypeScript Strict Mode** enforced
- **ESLint** with Next.js configuration
- **Pre-commit hooks** for code quality
- **Zod validation** for all user inputs
- **Error boundaries** for graceful error handling
- **Comprehensive logging** with structured format

## Testing Strategy - Enhanced

### Type Safety - Comprehensive
- TypeScript strict mode with comprehensive type definitions
- Interface verification patterns to prevent property access errors
- Type guards for union types and API responses
- Runtime validation with Zod schemas
- Build-time error prevention guidelines

### Manual Testing - Systematic
- Multi-user scenarios for SaaS isolation testing
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness across devices
- Interview companion end-to-end testing
- Email generation and webhook processing
- Error scenarios and edge cases

### Quality Assurance
- Pre-commit TypeScript compilation (`pnpm build`)
- Linting with ESLint and comprehensive rules
- Form validation testing with various input scenarios
- API integration testing with error handling
- Performance testing with large datasets

## Deployment - Production

### Vercel Platform
- **Hosting**: Vercel with automatic deployments from main branch
- **Edge Functions**: API routes deployed as edge functions
- **Environment Variables**: Secure management via Vercel dashboard
- **Domain Management**: Custom domain with SSL
- **Analytics**: Built-in performance monitoring

### Database Hosting
- **Supabase Cloud**: Managed PostgreSQL with global distribution
- **Backups**: Automatic daily backups with point-in-time recovery
- **Scaling**: Automatic scaling based on usage
- **Monitoring**: Real-time database metrics and alerts

### Monitoring & Observability
- **Error Tracking**: Structured logging with error boundaries
- **Performance Monitoring**: Core Web Vitals tracking
- **Database Metrics**: Query performance and connection monitoring
- **API Monitoring**: Response times and error rates
- **User Analytics**: Privacy-first usage analytics

### Security in Production
- **SSL/TLS**: End-to-end encryption for all communications
- **Environment Variables**: Secure secret management
- **RLS Policies**: Database-level security enforcement
- **CORS Configuration**: Proper origin restrictions
- **Rate Limiting**: API endpoint protection

## Common Development Patterns

### Form Handling - Enhanced
```typescript
// Server Action pattern with comprehensive validation
export async function createJob(formData: FormData) {
  'use server'
  
  // Authentication check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }
  
  // Validation with Zod
  const validatedData = jobSchema.parse({
    title: formData.get('title'),
    company_id: formData.get('company_id'),
    // ... other fields
  })
  
  // Database operation with RLS
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...validatedData, user_id: user.id })
    .select()
    .single()
  
  if (error) {
    return { error: 'Failed to create job' }
  }
  
  // Revalidate and return
  revalidatePath('/protected/jobs')
  return { data }
}
```

### Data Fetching - Server Components
```typescript
// Server Component pattern with user isolation
export default async function JobsPage() {
  // Prevent caching for user-specific data
  noStore()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')
  
  // User-specific query with RLS
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      companies(name, industry),
      job_requirements(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return <JobsList jobs={jobs} />
}
```

### Error Handling - Comprehensive
```typescript
// Client component error handling
'use client'

import { useToast } from "@/components/ui/use-toast"

export function MyComponent() {
  const { toast } = useToast()
  
  const handleAction = async () => {
    try {
      const result = await serverAction(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
        return
      }
      
      toast({
        title: "Success",
        description: "Operation completed successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }
  
  return <Button onClick={handleAction}>Submit</Button>
}
```

## Troubleshooting - Enhanced

### Common Issues & Solutions
1. **Authentication Issues**:
   - Check Supabase configuration and RLS policies
   - Verify cookie settings in middleware
   - Ensure proper `@supabase/ssr` usage

2. **Type Errors**:
   - Regenerate database types: `supabase gen types typescript`
   - Verify interface definitions before property access
   - Use type guards for union types

3. **Build Errors**:
   - Clear `.next` directory and rebuild
   - Check for unused variables and imports
   - Verify all async operations are properly awaited

4. **Interview Companion Issues**:
   - Check Recall.ai API key and webhook configuration
   - Verify Google Meet link format
   - Monitor webhook logs for processing errors

5. **Email Builder Issues**:
   - Verify Supabase Edge Function deployment
   - Check template configuration in database
   - Validate API payload structure

### Debug Tools & Strategies
- **Browser DevTools**: Network tab for API debugging
- **Supabase Dashboard**: Real-time database and auth logs
- **Vercel Functions**: Serverless function logs and metrics
- **TypeScript Compiler**: `pnpm build` for type checking
- **Database Logs**: RLS policy debugging
- **Webhook Testing**: Use ngrok for local webhook testing

## API Documentation - Comprehensive

### External APIs - Detailed
1. **OpenAI API**:
   - **Purpose**: AI-powered content generation
   - **Endpoints**: Chat completions, embeddings
   - **Usage**: Job descriptions, email content, interview analysis
   - **Rate Limiting**: Implemented per OpenAI guidelines

2. **Recall.ai API**:
   - **Purpose**: Google Meet recording and transcription
   - **Authentication**: API key with webhook verification
   - **Endpoints**: Bot management, transcript retrieval
   - **Integration**: Real-time status updates via webhooks

3. **Apify LinkedIn Scraper**:
   - **Purpose**: LinkedIn profile data extraction
   - **Rate Limiting**: Configured to avoid blocking
   - **Data Processing**: Profile reduction and skill extraction
   - **Error Handling**: Graceful fallback mechanisms

### Internal APIs - Enhanced
- **Server Actions**: 10+ actions for comprehensive data operations
- **API Routes**: File processing, webhook handling
- **Supabase Edge Functions**: AI processing, email generation
- **Webhook Endpoints**: Recall.ai integration with security

### API Response Patterns
```typescript
// Standard success response
{
  success: true,
  data: T
}

// Standard error response
{
  error: string,
  details?: ValidationError[]
}
```

## Architecture Patterns & Best Practices

### Component Composition
- **Compound Components**: Complex UI elements with sub-components
- **Render Props**: Flexible component APIs
- **Custom Hooks**: Reusable stateful logic
- **Higher-Order Components**: Cross-cutting concerns

### Data Flow Patterns
- **Server-First**: Data fetching in Server Components
- **Progressive Enhancement**: Client-side interactivity as enhancement
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Graceful error recovery

### Security Patterns
- **Defense in Depth**: Multiple security layers
- **Principle of Least Privilege**: Minimal permissions
- **Input Validation**: Client and server-side validation
- **Audit Logging**: Comprehensive operation tracking

## Future Enhancements & Roadmap

### Planned Features
1. **Advanced Analytics**: Recruitment pipeline analytics
2. **Team Collaboration**: Multi-user job management
3. **API Integrations**: ATS system connections
4. **Mobile App**: React Native companion app
5. **Advanced AI**: More sophisticated matching algorithms

### Technical Improvements
1. **Test Coverage**: Unit and integration tests
2. **Performance**: Further optimization opportunities
3. **Monitoring**: Enhanced observability
4. **Accessibility**: WCAG compliance improvements
5. **Internationalization**: Multi-language support

### Database Enhancements
1. **Audit Tables**: Comprehensive change tracking
2. **Soft Deletes**: Data retention policies
3. **Advanced Indexing**: Query performance optimization
4. **Partitioning**: Large dataset management
5. **Replication**: Multi-region support

## Documentation References

### Internal Documentation
- **API Docs**: `/docs/apis/` - Comprehensive API documentation
- **Database Schema**: `/docs/db-schema/` - Complete schema documentation
- **Patterns**: `/docs/patterns/` - Reusable code patterns
- **Rules**: `/docs/rules/` - Development guidelines
- **Features**: `/docs/features/` - Feature specifications

### External Resources
- **Next.js 15**: [Official Documentation](https://nextjs.org/docs)
- **Supabase**: [Documentation](https://supabase.com/docs)
- **ShadCN UI**: [Component Library](https://ui.shadcn.com/)
- **Tailwind CSS**: [Utility Classes](https://tailwindcss.com/docs)
- **TypeScript**: [Language Reference](https://www.typescriptlang.org/docs/)

## Critical Implementation Notes

### ⚠️ Important Reminders
1. **NEVER use deprecated `@supabase/auth-helpers-nextjs`** - Use `@supabase/ssr`
2. **ALWAYS use `getAll`/`setAll` for cookies** - Never use `get`/`set`/`remove`
3. **USE ShadCN toast system** - Never import from `sonner`
4. **IMPLEMENT `noStore()`** for user-specific pages
5. **CLEAR caches on logout** - Prevent data leakage
6. **VERIFY interfaces before property access** - Prevent runtime errors
7. **USE service role for webhook operations** - Bypass RLS when needed

### Development Checklist
- [ ] TypeScript strict mode compliance
- [ ] RLS policies on all tables
- [ ] User cache isolation implemented
- [ ] Error handling with toast notifications
- [ ] Input validation with Zod schemas
- [ ] Proper authentication checks
- [ ] Responsive design implementation
- [ ] Accessibility considerations
- [ ] Performance optimization
- [ ] Security best practices

---

*This comprehensive documentation reflects the current implementation as of August 2025. The application has evolved significantly with enhanced features, improved security, and production-ready architecture.*