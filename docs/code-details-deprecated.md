# Vita - Virtual Interface for Talent Acquisition

This document provides a comprehensive overview of the Vita application's code structure, architecture, and functionality to help developers and AI tools understand how the application works.

## Project Overview

Vita is a lightweight application designed to help recruiters streamline and speed up their workflows. The app revolves around a central object: the **Job**, which is structured into six sections reflecting the key stages of a typical recruiting process.

## Technology Stack

- **Frontend Framework**: Next.js (App Router)
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **Language**: TypeScript
- **Package Manager**: pnpm

## Directory Structure

```
/
├── app/                      # Next.js App Router directory
│   ├── about/                # About page
│   ├── auth/                 # Authentication pages
│   ├── protected/            # Protected routes requiring authentication
│   ├── globals.css          # Global CSS styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page component
├── components/               # Reusable React components
│   ├── ui/                  # UI components (shadcn/ui)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── tutorial/            # Tutorial-related components
│   ├── auth-button.tsx      # Authentication button component
│   ├── hero.tsx             # Hero section component
│   └── theme-switcher.tsx   # Theme switcher component
├── docs/                     # Documentation
│   ├── code-details.md      # This file - code documentation
│   └── prd.md               # Product Requirements Document
├── lib/                      # Utility functions and shared code
│   ├── supabase/            # Supabase integration
│   │   ├── client.ts        # Client-side Supabase client
│   │   ├── middleware.ts    # Supabase middleware for auth
│   │   └── server.ts        # Server-side Supabase client
│   └── utils.ts             # Utility functions
├── middleware.ts            # Next.js middleware (auth protection)
├── public/                   # Static assets
├── .env.local               # Environment variables (not in repo)
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Key Components and Architecture

### Authentication Flow

The application uses Supabase for authentication with a cookie-based session management approach:

1. **Middleware**: `middleware.ts` intercepts all requests to check for authentication status using `lib/supabase/middleware.ts`
2. **Server-side Auth**: `lib/supabase/server.ts` provides server-side authentication checks
3. **Client-side Auth**: `lib/supabase/client.ts` handles client-side authentication
4. **Auth Components**: Components like `auth-button.tsx`, `login-form.tsx`, and `sign-up-form.tsx` provide the UI for authentication

Protected routes are enforced by the middleware, which redirects unauthenticated users to the login page.

### UI Framework

The application uses a combination of:

- **Shadcn UI**: A collection of reusable components built on top of Radix UI
- **Radix UI**: Unstyled, accessible components
- **Tailwind CSS**: For styling and responsive design
- **Next Themes**: For dark/light mode support

Components are organized in the `/components` directory, with UI primitives in `/components/ui`.

### Data Model

The core data model revolves around these main entities:

1. **Jobs**: The central object in the app with structured attributes for each recruiting stage
2. **Candidates**: Profiles that include resume data, LinkedIn analysis, and interview evaluations
3. **Companies**: Company data that can be linked to multiple jobs
4. **Assessments**: AI-generated evaluations from interview answers

### Application Flow

The application follows a typical recruiting workflow with six key stages:

1. **Define**: Tools to capture and organize job information
2. **Source**: Tools to help find potential candidates
3. **Review**: Tools to evaluate candidate profiles
4. **Reach**: Tools for contacting and following up with candidates
5. **Assess**: Tools for conducting and evaluating interviews
6. **Submit**: Tools for presenting candidates to clients

## Key Files and Their Functions

### Core Configuration

- `app/layout.tsx`: Root layout with ThemeProvider setup
- `middleware.ts`: Authentication middleware
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration

### Authentication

- `lib/supabase/server.ts`: Server-side Supabase client
- `lib/supabase/client.ts`: Client-side Supabase client
- `lib/supabase/middleware.ts`: Middleware for authentication
- `components/login-form.tsx`: Login form component
- `components/sign-up-form.tsx`: Sign-up form component

### Main Pages

- `app/page.tsx`: Home page
- `app/about/page.tsx`: About page
- `app/auth/login/page.tsx`: Login page
- `app/auth/sign-up/page.tsx`: Sign-up page
- `app/protected/page.tsx`: Protected page example

## Development Workflow

1. **Local Development**: Run `pnpm dev` to start the development server on port 3000
2. **Authentication**: Supabase handles authentication with cookie-based sessions
3. **Database Access**: Server components use server-side Supabase client, client components use client-side Supabase client
4. **Styling**: Use Tailwind CSS for styling with shadcn/ui components

## Best Practices

### Security

- Environment variables are used for Supabase URL and API keys
- Authentication is enforced via middleware
- Protected routes require authentication
- Row Level Security (RLS) should be implemented in Supabase

### Performance

- Use React Server Components when possible
- Minimize client-side JavaScript
- Optimize images and assets

### Code Organization

- Group files by domain when possible
- Use `/components/ui` for UI components
- Place components in the app directory `/components` and combine by usecase in subdirectories

## Integrations

### Supabase

The application uses Supabase for:

1. **Authentication**: User sign-up, login, password reset
2. **Database**: Storage for jobs, candidates, companies, and assessments
3. **Row Level Security**: For data protection

## Future Enhancements

Based on the PRD, future enhancements may include:

1. **Email Integration**: Direct email sending from the app
2. **Premium Features**: Request for pre-vetted available candidates
3. **Advanced Analytics**: Reporting and insights on recruiting process

## Troubleshooting

- **Authentication Issues**: Check Supabase configuration and environment variables
- **UI Issues**: Verify Tailwind and shadcn/ui setup
- **API Errors**: Check Supabase logs and console for errors

---

This documentation will be updated as the project evolves.