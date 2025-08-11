export const TOOL_NAME_MAPPING: Record<string, string> = {
  'job-description-builder': 'Job Description Builder',
  'interview-analysis': 'Interview Analysis',
  'interview-questions-generator': 'Interview Questions Generator',
  'linkedin-query-builder': 'LinkedIn Query Builder',
  'email-builder': 'Email Builder',
  'candidate-match-analysis': 'Candidate Match Analysis',
}

export const BREADCRUMB_ROUTES = {
  JOBS: '/protected/jobs',
  JOB_DETAIL: (jobId: string) => `/protected/jobs/${jobId}`,
  JOB_TOOL: (jobId: string, toolName: string) => `/protected/jobs/${jobId}/${toolName}`,
  CANDIDATES: '/protected/candidates',
} as const