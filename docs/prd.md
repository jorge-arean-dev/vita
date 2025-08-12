# App: Vita – your Virtual Interface for Talent Acquisition

## Overview
Vita is an AI-powered recruitment platform designed to streamline and accelerate recruiter workflows. Built on Next.js 15 with Supabase backend, the application centers around the **Job** object, providing intelligent tools that automate repetitive tasks and deliver data-driven insights throughout the hiring process.

The platform provides a comprehensive suite of recruitment tools organized by function, including advanced features like real-time interview recording and analysis. It leverages advanced AI capabilities to generate content, analyze candidates, and provide strategic recommendations - all with one-click copy functionality for seamless integration with existing tools.

---

## 📋 Job Description Builder
*Tools to help you capture and organize what the job is about.*

### Features:
- **📝 Client Call Notes Input**: Rich text editor for capturing detailed job requirements from client conversations
- **🏢 Company Management**: 
  - Create and save companies with industry classification
  - Searchable company database for reuse across jobs
  - Company details include name, website, industry, and location
- **🤖 AI Role Analysis**: 
  - Advanced natural language processing to extract job attributes
  - Automatic identification of requirements, skills, and experience levels
  - Structured data extraction from unstructured notes
- **📄 Job Description Generator**: 
  - Professional job descriptions generated in seconds
  - Consistent formatting and tone
  - Customizable based on company style and industry
- **📊 Job Attributes**:
  - Rate (hourly/annual with currency)
  - Commitment type (full-time, part-time, contract)
  - Duration and location preferences
  - Geographic regions and countries
  - Remote work options

✅ **Copy Functionality**: All generated content includes one-click copy buttons

---

## 🔍 LinkedIn Query Builder
*Tools to help you find potential candidates for the job.*

### Features:
- **Boolean Search Generation**: 
  - AI-powered Boolean search string generation
  - Optimized for LinkedIn Recruiter and Sales Navigator
  - Incorporates job requirements, skills, and location preferences
  - Multiple query variations for comprehensive searches
- **🎯 Smart Query Generation**:
  - Technology stack matching
  - Experience level targeting
  - Location-based filtering
  - Industry-specific keywords

✅ **Copy Functionality**: Boolean queries ready for immediate use

---

## 🎯 Candidate Match Analysis
*Tools to help you check if a talent matches the job.*

### Core Features:
- **🔗 LinkedIn Profile Analysis**:
  - Complete automated pipeline for profile analysis
  - Professional LinkedIn data extraction
  - AI-powered skill identification and experience evaluation
  - Comprehensive profile insights including:
    - Work history and progression
    - Skill extraction with proficiency levels
    - Years of experience calculation
    - Education and certifications
- **📑 PDF Resume Analysis**:
  - Advanced OCR and text extraction
  - AI-powered skill and keyword identification
  - Experience level assessment
  - Automatic candidate profile creation
- **👥 Candidate Management**:
  - Save candidates to job-specific pools
  - Track candidate source (LinkedIn/Resume)
  - Maintain complete candidate database
  - Link multiple candidates to jobs

### Advanced Match Analysis:
- **AI-Powered Matching Algorithm**:
  - Sophisticated scoring system (0-100%)
  - Requirement-by-requirement evaluation
  - Weighted importance factors
  - Status classification (Strong/Adequate/Weak/Missing)
- **📊 Comprehensive Reports**:
  - Overall match percentage
  - Individual requirement scores
  - Strengths and gaps analysis
  - Interview strategy recommendations
  - Alternative positioning suggestions
- **💾 Analysis Management**:
  - Save and review past analyses
  - Compare multiple candidates
  - Track analysis history

✅ **Copy Functionality**: Export analysis results and candidate summaries

---

## ✉️ Email Builder
*Tools to help you contact and follow up with candidates.*

### Features:
- **Email Templates**:
  - First-time outreach
  - Follow-up messages
  - Interview scheduling
  - Interview feedback (positive, next step, or rejection)
  - Additional customizable templates
- **Personalization**:
  - Job data integration
  - Candidate information merging
  - Smart field replacements
- **Future Capabilities**:
  - Direct email sending integration
  - Email tracking and analytics
  - Automated follow-up sequences

✅ **Copy Functionality**: Email content ready for external mail clients

---

## 💬 Interview Tools
*Tools to help you guide and review conversations with candidates.*

### Interview Questions Generator:
- **Dynamic Question Generation**: AI-powered questions based on job requirements
- **Structured Question Categories**: Exactly 6 categories (Technical, Problem-solving, Communication, Leadership, Learning, Cultural)
- **Two Questions Per Category**: Comprehensive candidate evaluation framework
- **Job-Specific Tailoring**: Questions generated from job descriptions and requirements
- **Support for All Recruiters**: Designed for both technical and non-technical interviewers

✅ **Copy Functionality**: Generated questions ready for immediate use

### Interview Companion (Live Recording & Analysis):
- **Real-Time Recording**: Automated Google Meet interview recording using Recall.ai bot integration
- **Live Transcription**: Real-time speech-to-text conversion with speaker identification  
- **AI-Powered Analysis**: Comprehensive interview evaluation using advanced AI models
- **Competency Scoring**: Structured scoring across key competency areas
- **Interview Management**: Create, track, and manage interview sessions
- **Webhook Integration**: Real-time status updates and transcript processing
- **Actionable Insights**: Data-driven hiring recommendations based on interview performance

### Interview Analysis (Manual Entry):
- **Response Evaluation**: Paste candidate answers for AI analysis
- **Performance Scoring**: Objective assessment of each response
- **Feedback Generation**: Actionable insights on candidate performance
- **Interview Records**: Save assessments linked to candidates and jobs

✅ **Copy Functionality**: Analysis results and interview summaries ready for sharing

---

## 🚀 Landing Page & Waitlist
*Public-facing platform to attract and manage prospects.*

### Features:
- **Professional Landing Page**: Modern, responsive design showcasing platform capabilities
- **Waitlist Management**: Comprehensive form collecting prospect information
- **User Profiling**: Detailed data collection including:
  - Personal information (name, email, LinkedIn)
  - Professional details (role, industry, country)
  - Tool preferences and AI experience
  - Custom "Other" options for flexibility
- **Data Validation**: Country verification against database
- **Lead Qualification**: Structured data collection for targeted outreach

### Waitlist Data Capture:
- Contact information and professional background
- Current tools and AI tool usage patterns
- Industry and role classification
- Geographic distribution tracking
- Source attribution for marketing analytics

---

## App Structure & Navigation

### Main Sections:
- **Jobs Dashboard**: Central hub for managing all job postings
- **Candidates View**: Complete candidate database with search capabilities
- **Companies Management**: Reusable company directory
- **Settings & Profile**: User preferences and account management

### Job Tools Navigation:
When viewing a job, users can access all tools through a clean grid layout:
- Job Description Builder
- LinkedIn Query Builder
- Candidate Match Analysis
- Email Builder
- Interview Questions Generator
- Interview Analysis (Manual Entry)
- Interview Companion (Live Recording)

### Authentication & User Management:
- **Secure Authentication**: Supabase Auth with email/password login
- **User Profiles**: Complete profile management with avatar support
- **Password Management**: Secure password reset and update functionality
- **Session Security**: Automatic session management with proper logout procedures

### User Interface:
- Modern, intuitive design with Shadcn UI components
- Dark/light mode support throughout the application
- Mobile-responsive interface optimized for all devices
- Accessibility-compliant components following WCAG guidelines
- Centralized font system with portal element support for modals and dropdowns

---

## Key User Workflows

### Job Creation Flow:
The job creation process is streamlined through a simple wizard:

1. **Initiation**: Click "Create Job" button
2. **Job Details Form**:
   - Job title/name (required)
   - Company selection (searchable dropdown with existing companies)
   - Initial notes/requirements (rich text editor)
3. **Smart Creation**: Instant job creation with intelligent defaults
4. **Tool Access**: Immediate access to all recruitment tools

### Candidate Creation Flow:
Multiple pathways for adding candidates to the system:

1. **Manual Entry**:
   - Personal information form (name, email, contact details)
   - Professional details (LinkedIn, GitHub, years of experience)
   - Skills and experience level input
   
2. **LinkedIn Profile Import**:
   - URL input for LinkedIn profile extraction
   - Automated profile parsing using Apify integration
   - AI-powered skill identification and experience calculation
   - Automatic candidate profile creation with structured data

3. **Resume Upload**:
   - PDF file upload with OCR processing
   - AI-powered text extraction and skill parsing
   - Automatic candidate profile generation
   - Resume file storage for future reference

4. **Data Processing**:
   - Skills categorization by type (technical, soft skills, etc.)
   - Proficiency level assignment based on experience
   - Source tracking (manual, LinkedIn, resume) for data integrity

---

## 🗂️ Data Model Overview

### Core Entities:
- **Jobs**: Central object with comprehensive attributes
  - Job details, requirements, location preferences
  - Pay structure and commitment types (hourly/annual rates, full-time/contract)
  - Geographic constraints (regions, countries, timezones)
  - Links to companies and candidates
- **Candidates**: Complete talent profiles
  - Personal details (first name, last name, email)
  - Professional links (LinkedIn, GitHub)
  - Resume file storage with PDF upload support
  - Geographic information and years of experience
- **Companies**: Reusable organization profiles
  - Company information with industry classification
  - Website, LinkedIn, and culture information
  - Country-based location tracking
- **Match Analysis**: AI-generated evaluations
  - Comprehensive candidate-job compatibility scoring
  - Requirement-level analysis and recommendations
  - Historical analysis tracking for decision support

### Interview System:
- **Interviews**: Session management with Recall.ai integration
  - Google Meet link processing and bot deployment
  - Status tracking (created, in_progress, ready_for_analysis, analyzing, completed)
  - Real-time webhook integration for status updates
- **Interview Transcripts**: Detailed conversation records
  - Speaker identification and timestamp tracking
  - Real-time transcript processing and storage
- **Interview Scores**: AI-powered evaluation results
  - Overall scoring (0-4 scale) with detailed analysis
  - Competency-based assessment with actionable insights

### Email Builder System:
- **Email Templates**: Structured content generation
  - Multiple email types (outreach, follow-up, scheduling)
  - Job and candidate context integration
  - Template versioning and customization
- **Job Email Builder**: Personalized content management
  - Subject line and body content generation
  - Candidate and client-focused variations

### Supporting Data:
- **Geographic Data**: Countries (250+), regions, timezones with display names
- **Industry Classifications**: Comprehensive industry mapping
- **Skill Management**: Skill types, proficiency levels, and source tracking
- **Job Attributes**: Pay frequencies, durations, commitment types, location types
- **Waitlist Data**: Prospect information with detailed qualification data

---

## 🚀 Technology Overview

### Technical Architecture:
- **Frontend**: Next.js 15 with App Router and React Server Components
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **UI Framework**: Shadcn UI + Radix UI with Tailwind CSS
- **Language**: TypeScript with strict mode enforcement
- **State Management**: Server Actions and React Server Components
- **Validation**: Zod schema validation throughout

### AI-Powered Capabilities:
- Natural language processing for job requirement extraction
- Intelligent Boolean query generation for LinkedIn search optimization
- Advanced candidate-job matching algorithms with weighted scoring
- Resume and LinkedIn profile parsing with skill identification
- Interview question generation across 6 structured categories
- Real-time interview analysis and scoring with competency assessment
- Professional email content generation with personalization

### Integration Points:
- **Recall.ai**: Real-time interview recording and transcription
- **Apify**: LinkedIn profile data extraction and processing
- **Supabase Storage**: PDF resume upload and processing
- **Webhook System**: Real-time status updates and data synchronization
- **File Processing**: OCR and text extraction for resume analysis

### Security & Privacy:
- **Authentication**: Supabase Auth with secure session management
- **Data Isolation**: Row Level Security (RLS) policies for multi-tenant architecture
- **API Security**: Server-side validation and authorization checks
- **File Security**: Secure storage buckets with proper access controls
- **Cache Isolation**: User-specific cache keys to prevent data leakage
- **GDPR Compliance**: Structured data handling with proper consent mechanisms

---

## 🎯 Key Benefits

### For Recruiters:
- **Comprehensive Automation**: From job creation to interview analysis, reduce manual work
- **AI-Enhanced Decision Making**: Objective candidate scoring and requirement analysis
- **Professional Communication**: Generated emails, job descriptions, and search queries
- **Real-Time Interview Intelligence**: Live recording and instant analysis with actionable insights
- **Organized Multi-Job Management**: Centralized platform for managing entire recruitment pipeline
- **Data-Driven Insights**: Historical analysis tracking and performance metrics

### For Organizations:
- **End-to-End Recruitment Platform**: Complete solution from sourcing to hiring decisions
- **Advanced Interview Capabilities**: Real-time recording and AI analysis reduce interviewing bias
- **Quality Assurance**: Consistent evaluation processes across all positions and interviewers
- **Faster Time-to-Hire**: Automated workflows and instant candidate analysis
- **Scalable Architecture**: Handle multiple concurrent hiring processes efficiently
- **Compliance & Documentation**: Structured data collection and evaluation records

---

*Vita - Transforming recruitment through intelligent automation*