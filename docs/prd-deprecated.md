
# App: Vita – your Virtual Interface for Talent Acquisition

## Overview
Vita is a lightweight application designed to help recruiters streamline and speed up their workflows. The app revolves around a central object: the **Job**.

Each job is structured into six sections, reflecting the key stages of a typical recruiting process. Each section includes tools to help with that stage, and AI-generated outputs come with a **copy icon** so users can easily copy content for external use.

---

## 🔹 1. Define  
**Subtitle:** *Tools to help you capture and organize what the job is about.*

This section helps users gather and structure the core job information. Users may start from scratch or import an existing job description:
- **Client Call Notes Input**: Enter notes from client conversations about the open role, or paste an existing job description.
- **Company Information**: Input/load/save key company details like name, website and industry. Saved companies can be reused across different jobs.
- **Role Analysis**: The app uses AI to extract key job attributes from the notes.
- **Job Description**: Automatically generate a complete job description from those attributes.

Users can choose to **save** the company for future jobs.

✅ **Copy Icon Available**: Copy job descriptions and extracted role details.

---


## 🔹 2. Source  
**Subtitle:** *Tools to help you find potential candidates for the job.*

This section supports talent sourcing:
- **Boolean Query Generator for LinkedIn**: Creates job-based Boolean search queries, ready for LinkedIn Recruiter or Sales Navigator.
- **Request for Pre-Vetted Available Candidates**: Premium feature to request vetted and available talent. This feature won't be implemented in this version.

✅ **Copy Icon Available**: Easily copy Boolean strings or candidate lists.

---

## 🔹 3. Review  
**Subtitle:** *Tools to help you check if a talent matches the job.*

This section helps evaluate candidate profiles:
- **LinkedIn Profile Analysis**: Input a candidate’s LinkedIn URL to get a full analysis. An external API will be used to fetch the profile. This API will be provided by later in the process.
- **PDF Resume Analysis**: Upload a PDF resume for structured, AI-driven insights.

Users can choose to **save** candidates for future steps. Saved candidates will be linked to the current job.

✅ **Copy Icon Available**: Copy profile summaries and insights when needed.

---

## 🔹 4. Reach  
**Subtitle:** *Tools to help you contact and follow up with candidates.*

This section assists with email communications:
- Message templates include:
  - First-time outreach
  - Follow-up messages
  - Interview scheduling
  - Interview feedback (positive, next step, or rejection)
  - among other templates

Saved candidates' details (like name) can be used to personalize each message.

This feature will allow the user to copy the email body to be pasted into their email client. In a future version, the user will be able to send the email directly from the app.

✅ **Copy Icon Available**: All generated emails are easy to copy and send via your preferred tools.

---

## 🔹 5. Assess  
**Subtitle:** *Tools to help you guide and review conversations with candidates.*

This section provides AI assistance for conducting and evaluating interviews:
- **Interview Questions**:  
  Users can click a button to generate a tailored list of questions based on the job. Designed to support both technical and non-technical recruiters.

- **Interview Review**:  
  After the interview, users can paste candidate answers. The AI analyzes each response and provides a score or feedback to assess candidate performance.
  
Users can choose to **save** interview assessments. Saved interview assessments will be linked to the current job.

---

## 🔹 6. Submit  
**Subtitle:** *Tools to help you present candidates to clients.*

This section is used to share candidate profiles with clients:
- Users can generate customized messages that include candidate information (if saved).
- These messages help recruiters communicate clearly and efficiently with clients.

✅ **Copy Icon Available**: Emails and summaries can be copied for client communications.

---

## App Structure
After logging in, users have access to:
- **Jobs**
- **Candidates**
- **Companies**
- **Settings**

---

## Job Creation Flow
- The user clicks a button or trigger to start job creation.
- A dialog opens prompting for:
  - **Job Name**
  - **Company**
  - **Initial Notes**
- After clicking **Create Job**, the job page opens.
- At the top of the job page, users will see a **stage navigator** — a visual representation of the six key stages:  
  **Define**, **Source**, **Review**, **Reach**, **Assess**, **Submit**.  
  This navigator reflects the typical recruiting sequence but allows users to move freely between stages as needed, depending on their current task or workflow.

---

## 🗂️ Data Model Overview

At the core of Vita's database, the following main entities are represented as persistent tables:

- **Jobs**: The central object in the app. Each job includes structured attributes.
- **Candidates**: Profiles that include resume data, LinkedIn analysis, sourcing notes, and interview evaluations. Candidates are linked to specific jobs.
- **Companies**: Stores company data (name, website, industry, etc.) that can be linked to multiple jobs.
- **Assessments**: Stores AI-generated evaluations from interview answers, associated with both candidates and jobs.

These tables represent the core objects in Vita’s workflow. Additional tables (such as users, messages, or activity logs) may exist to support app functionality but are secondary to the recruiting flow.

