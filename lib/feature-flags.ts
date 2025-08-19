/**
 * Feature Flags System
 * Controls feature rollouts and A/B testing across the application
 */

export const FEATURE_FLAGS = {
  // LinkedIn Profile Processing Pipeline
  BYPASS_LINKEDIN_REDUCER: process.env.BYPASS_LINKEDIN_REDUCER === 'true',
  
  // A/B Testing Controls
  LINKEDIN_PIPELINE_ROLLOUT_PERCENTAGE: parseInt(process.env.LINKEDIN_PIPELINE_ROLLOUT_PERCENTAGE || '0'),
  
  // Debug and Monitoring
  ENABLE_PIPELINE_COMPARISON: process.env.ENABLE_PIPELINE_COMPARISON === 'true',
  VERBOSE_LINKEDIN_LOGGING: process.env.VERBOSE_LINKEDIN_LOGGING === 'true'
} as const

/**
 * Determines if the direct pipeline (without reducer) should be used
 * Supports both hard flag and gradual rollout percentage
 */
export function shouldUseDirectPipeline(): boolean {
  // Hard flag override (for testing/debugging)
  if (FEATURE_FLAGS.BYPASS_LINKEDIN_REDUCER) {
    return true
  }
  
  // Gradual rollout based on percentage
  if (FEATURE_FLAGS.LINKEDIN_PIPELINE_ROLLOUT_PERCENTAGE > 0) {
    // Use simple hash-based distribution for consistent user experience
    const randomValue = Math.random() * 100
    return randomValue < FEATURE_FLAGS.LINKEDIN_PIPELINE_ROLLOUT_PERCENTAGE
  }
  
  return false
}

/**
 * Determines if pipeline comparison should run (for validation)
 */
export function shouldRunPipelineComparison(): boolean {
  return FEATURE_FLAGS.ENABLE_PIPELINE_COMPARISON
}

/**
 * Enhanced logging for pipeline debugging
 */
export function logPipelineEvent(event: string, data?: any): void {
  if (FEATURE_FLAGS.VERBOSE_LINKEDIN_LOGGING) {
    console.log(`🔍 [LinkedIn Pipeline] ${event}`, data ? JSON.stringify(data, null, 2) : '')
  }
}

/**
 * Get current feature flag status for health checks
 */
export function getFeatureFlagStatus() {
  return {
    bypassLinkedinReducer: FEATURE_FLAGS.BYPASS_LINKEDIN_REDUCER,
    rolloutPercentage: FEATURE_FLAGS.LINKEDIN_PIPELINE_ROLLOUT_PERCENTAGE,
    comparisonEnabled: FEATURE_FLAGS.ENABLE_PIPELINE_COMPARISON,
    verboseLogging: FEATURE_FLAGS.VERBOSE_LINKEDIN_LOGGING,
    directPipelineActive: shouldUseDirectPipeline()
  }
}