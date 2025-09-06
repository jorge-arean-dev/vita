# Supabase Edge Functions

## Directory Structure

```
supabase/functions/
├── _shared/                        # Shared modules (single source of truth)
│   └── skill-definitions.ts        # Centralized skill categorization definitions
├── job-details-extractor/          # Extracts structured job details from descriptions
│   └── index.ts                    # v2.0.1 - Uses shared definitions
├── parse-linkedin-skill/           # Parses LinkedIn profiles for skills
│   └── index.ts                    # v2.0.1 - Uses shared definitions
└── README.md                        # This file
```

## Shared Module Pattern

### ✅ Correct Import Pattern
Functions should import from the ROOT `_shared` folder:

```typescript
// ✅ CORRECT - Import from root _shared
import { 
  SOFT_SKILLS_KEYWORDS,
  PROFICIENCY_LEVEL_CRITERIA,
  SKILL_TYPE_CATEGORIES
} from '../_shared/skill-definitions.ts';
```

### ❌ Incorrect Pattern
Avoid creating duplicate `_shared` folders within each function:

```typescript
// ❌ WRONG - Don't create function-specific _shared folders
import { ... } from './_shared/skill-definitions.ts';
```

## Shared Definitions Module

### Location
`supabase/functions/_shared/skill-definitions.ts`

### Contents
- **SOFT_SKILLS_KEYWORDS**: Array of 44 soft skills for detection
- **PROFICIENCY_LEVEL_CRITERIA**: Mapping of years of experience to proficiency levels
- **SKILL_TYPE_CATEGORIES**: Complete definitions for all skill categorizations

### Functions Using Shared Definitions
1. **job-details-extractor** - Processes job descriptions
2. **parse-linkedin-skill** - Processes LinkedIn profiles

## Deployment

### Using Supabase CLI
```bash
# Deploy a function (automatically includes _shared dependencies)
supabase functions deploy job-details-extractor

# Deploy multiple functions
supabase functions deploy parse-linkedin-skill
```

### Version History
- **v2.0.0** (2025-01-06): Initial migration to shared definitions
- **v2.0.1** (2025-01-06): Fixed import paths to use root _shared folder

## Maintenance

### To Update Skill Definitions
1. Edit: `supabase/functions/_shared/skill-definitions.ts`
2. Deploy affected functions:
   ```bash
   supabase functions deploy job-details-extractor
   supabase functions deploy parse-linkedin-skill
   ```

### Benefits of This Pattern
- **Single Source of Truth**: One file to maintain for all skill definitions
- **Consistency**: All functions use identical categorization logic
- **Efficiency**: Update once, deploy to all dependent functions
- **Scalability**: New functions can easily import shared definitions

## Other Functions

The following functions are deployed but not using shared definitions:
- generate-linkedin-queries
- generate-interview-questions
- generate-job-description
- email-builder
- match-analysis-linkedin-v2
- match-analysis-pdf-v2
- match-analysis-fallback-v2
- simulate-interview

These can be downloaded from the Supabase Dashboard when needed for maintenance.

## Notes

- This project uses **Supabase Cloud** (not local/self-hosted)
- Project ID: `klhhdgizxytfmolwabfl`
- Dashboard: https://supabase.com/dashboard/project/klhhdgizxytfmolwabfl/functions

---

Last Updated: 2025-01-06