# Supabase Database Schema - Vita Project

## Table of Contents
1. [Tables Overview](#tables-overview)
2. [Detailed Table Schemas](#detailed-table-schemas)
3. [Entity Relationships](#entity-relationships)

## Tables Overview

Your database contains 23 tables:

1. `candidate_interview_evaluation` - Stores evaluation scores for candidate interviews
2. `candidates` - Stores candidate information
3. `candidates_skills` - Junction table for candidate skills
4. `companies` - Stores company information
5. `countries` - Stores country data
6. `industries` - Stores industry categories
7. `job_candidate_evaluation` - Stores evaluations of candidates for specific jobs
8. `job_candidate_match_analysis` - Stores analysis of candidate matches for jobs
9. `job_commitment_types` - Reference table for job commitment types
10. `job_durations` - Reference table for job duration options
11. `job_interview_transcript` - Stores interview transcripts
12. `job_location_types` - Reference table for job location types
13. `job_pay_frequencies` - Reference table for payment frequency options
14. `job_questions` - Stores questions related to specific jobs
15. `job_requirements` - Stores skill requirements for jobs
16. `jobs` - Stores job listings
17. `proficiency_levels` - Reference table for skill proficiency levels
18. `profiles` - Stores user profiles
19. `question_types` - Reference table for question types
20. `regions` - Stores geographical regions
21. `skill_sources` - Reference table for skill source types
22. `skill_types` - Reference table for skill categories
23. `timezones` - Reference table for timezones

## Detailed Table Schemas

### candidate_interview_evaluation

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_interview_transcript_id | uuid | NO | | UNIQUE, FOREIGN KEY (job_interview_transcript.id) |
| technical_skills_score | numeric | YES | | |
| problem_solving_score | numeric | YES | | |
| communication_collaboration_score | numeric | YES | | |
| leadership_initiative_score | numeric | YES | | |
| adaptability_learning_agility_score | numeric | YES | | |
| cultural_fit_values_alignment_score | numeric | YES | | |
| feedback | text | YES | | |
| suggestions | text | YES | | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### candidates

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) |
| first_name | text | NO | | |
| last_name | text | NO | | |
| email | text | NO | | |
| phone | text | YES | | |
| country | text | YES | | FOREIGN KEY (countries.iso_code) |
| city | text | YES | | |
| bio | text | YES | | |
| headline | text | YES | | |
| avatar_url | text | YES | | |
| resume_url | text | YES | | |
| linkedin_url | text | YES | | |
| github_url | text | YES | | |
| website_url | text | YES | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### candidates_skills

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| candidate_id | uuid | NO | | FOREIGN KEY (candidates.id) |
| name | text | NO | | |
| type | text | NO | | FOREIGN KEY (skill_types.name) |
| proficiency_level | text | NO | | FOREIGN KEY (proficiency_levels.name) |
| source | text | NO | | FOREIGN KEY (skill_sources.name) |
| years_experience | integer | YES | | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### companies

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) |
| name | text | NO | | |
| website | text | YES | | |
| logo_url | text | YES | | |
| country | text | YES | | FOREIGN KEY (countries.iso_code) |
| city | text | YES | | |
| description | text | YES | | |
| industry_id | uuid | YES | | FOREIGN KEY (industries.id) |
| size | text | YES | | |
| founded_year | integer | YES | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### countries

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| iso_code | text | NO | | PRIMARY KEY |
| name | text | NO | | |
| region | text | YES | | FOREIGN KEY (regions.name) |
| region_parent | text | YES | | FOREIGN KEY (regions.name) |
| primary_timezone | text | YES | | FOREIGN KEY (timezones.name) |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### industries

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_candidate_evaluation

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) |
| candidate_id | uuid | NO | | FOREIGN KEY (candidates.id) |
| technical_skills_score | numeric | YES | | |
| problem_solving_score | numeric | YES | | |
| communication_collaboration_score | numeric | YES | | |
| leadership_initiative_score | numeric | YES | | |
| adaptability_learning_agility_score | numeric | YES | | |
| cultural_fit_values_alignment_score | numeric | YES | | |
| overall_match_score | numeric | YES | | |
| feedback | text | YES | | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_candidate_match_analysis

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) |
| candidate_id | uuid | NO | | FOREIGN KEY (candidates.id) |
| match_score | numeric | YES | | |
| strengths | text | YES | | |
| gaps | text | YES | | |
| recommendations | text | YES | | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_commitment_types

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_durations

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_interview_transcript

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) |
| candidate_id | uuid | NO | | FOREIGN KEY (candidates.id) |
| transcript | text | YES | | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_location_types

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_pay_frequencies

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_questions

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) |
| question | text | NO | | |
| type | text | NO | | FOREIGN KEY (question_types.name) |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### job_requirements

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) |
| name | text | NO | | |
| type | text | NO | | FOREIGN KEY (skill_types.name) |
| proficiency_level | text | NO | | FOREIGN KEY (proficiency_levels.name) |
| years_experience | integer | YES | | |
| is_required | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### jobs

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) |
| company_id | uuid | NO | | FOREIGN KEY (companies.id) |
| title | text | NO | | |
| description | text | NO | | |
| commitment | text | NO | | FOREIGN KEY (job_commitment_types.name) |
| duration | text | YES | | FOREIGN KEY (job_durations.name) |
| location_reqs | text | NO | | FOREIGN KEY (job_location_types.name) |
| location_details | text | YES | | |
| timezone | text | YES | | FOREIGN KEY (timezones.name) |
| min_pay | integer | YES | | |
| max_pay | integer | YES | | |
| pay_freq | text | YES | | FOREIGN KEY (job_pay_frequencies.name) |
| currency | text | YES | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### proficiency_levels

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| level | integer | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### profiles

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | | UNIQUE |
| user_type | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### question_types

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### regions

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| parent | text | YES | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### skill_sources

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### skill_types

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

### timezones

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | | UNIQUE |
| display_name | text | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp with time zone | NO | now() | |
| updated_at | timestamp with time zone | NO | now() | |

## Entity Relationships

### Key Relationships

1. **User-Profile-Role System**:
   - `profiles` has user accounts with `user_type` determining role
   - `profiles` links to both `candidates` and `companies` via `user_id`

2. **Jobs and Requirements**:
   - `jobs` are created by companies
   - `job_requirements` define skills needed for jobs
   - `job_questions` store interview questions for jobs

3. **Candidates and Skills**:
   - `candidates` represent job seekers
   - `candidates_skills` tracks candidate abilities
   - Skills have types, proficiency levels, and sources

4. **Interview and Evaluation Process**:
   - `job_interview_transcript` stores interview content
   - `candidate_interview_evaluation` contains interview assessments
   - `job_candidate_evaluation` provides overall candidate evaluations
   - `job_candidate_match_analysis` analyzes job-candidate fit

5. **Reference Tables**:
   - Various lookup tables (`job_commitment_types`, `proficiency_levels`, etc.)
   - Geographic data (`countries`, `regions`, `timezones`)

### Row-Level Security

All tables have RLS enabled, ensuring proper data access control.
