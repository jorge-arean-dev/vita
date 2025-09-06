/**
 * LinkedIn Match Analysis API
 * Processes LinkedIn profile data using unified matching engine
 * 
 * Updated: 2025-08-27 - Fixed mandatory requirement counting (only 'strong' = met)
 * Updated: 2025-01-04 15:20 - Fixed proficiency field mapping (proficiency → proficiencyLevel) and added missing type field for Laravel matching issue
 * Updated: 2025-01-04 15:25 - Fixed field name mismatch: unified JobRequirement.skill → JobRequirement.name for consistent matching
 * Updated: 2025-01-04 16:20 - Added null safety checks for undefined requirement objects and defensive logging
 */ import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { analyzeCandidate } from '../_shared/core-matching-engine.ts';
import { generateNarrativeOutputs } from '../_shared/narrative-generator.ts';
import { detectCandidateSeniority } from '../_shared/seniority-detector.ts';
import { matchSeniority, applySeniorityPenalty, adjustCategoryForSeniority, generateSeniorityRecommendations } from '../_shared/seniority-matcher.ts';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Parse request body - expecting legacy format { candidate, job }
    const { candidate: parsedCandidate, job } = await req.json();
    console.log('[LinkedIn API] Received parsed candidate data');
    console.log('[LinkedIn API] Parsed candidate structure:', {
      hasMain: !!parsedCandidate?.main,
      mainName: `${parsedCandidate?.main?.first_name} ${parsedCandidate?.main?.last_name}`,
      skillsCount: parsedCandidate?.skills?.length || 0,
      yearsExp: parsedCandidate?.years_of_experience,
      skillsPreview: parsedCandidate?.skills?.slice(0, 3)
    });
    // Extract data from legacy format
    const linkedInProfile = parsedCandidate?.raw_linkedin_profile;
    const jobRequirements = job?.requirements || [];
    console.log('[LinkedIn API] Raw job requirements:', {
      count: jobRequirements.length,
      sample: jobRequirements.slice(0, 3),
      hasNullItems: jobRequirements.some((req)=>!req || !req.requirement)
    });
    const jobInfo = {
      id: 'temp-job-id',
      title: job?.attributes?.title || 'Unknown Position',
      company: job?.attributes?.company || 'Unknown Company'
    };
    // Validate required fields
    if (!parsedCandidate || !parsedCandidate.skills) {
      throw new Error('Parsed candidate data with skills is required');
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required');
    }
    if (!job || !job.attributes || !job.attributes.title) {
      throw new Error('Job information is required');
    }
    console.log('[LinkedIn API] Processing match analysis for job:', jobInfo.title);
    // Step 1: Convert parsed candidate to unified format
    const skills = parsedCandidate.skills || [];
    console.log('[LinkedIn API] Converting skills:', skills.length, 'skills found');
    // Extract job titles from LinkedIn experiences and add as role-type skills
    // Added: 2025-01-04 23:30 - Extract actual job titles as role-type skills for better role matching
    const roleSkills = [];
    if (parsedCandidate.raw_linkedin_profile?.experiences) {
      const experiences = parsedCandidate.raw_linkedin_profile.experiences;
      console.log(`[LinkedIn API] Extracting roles from ${experiences.length} experiences`);
      for (const exp of experiences){
        if (exp.title) {
          // Clean and normalize the job title
          const roleTitle = exp.title.trim();
          // Calculate years in this role based on caption (e.g., "4 yrs 10 mos")
          let roleYears = 0;
          if (exp.caption) {
            const yearMatch = exp.caption.match(/(\d+)\s*yr/);
            const monthMatch = exp.caption.match(/(\d+)\s*mo/);
            if (yearMatch) roleYears += parseInt(yearMatch[1]);
            if (monthMatch) roleYears += parseInt(monthMatch[1]) / 12;
            roleYears = Math.round(roleYears * 10) / 10 // Round to 1 decimal
            ;
          }
          // Determine proficiency based on years in role
          let proficiency = 'beginner';
          if (roleYears >= 3) proficiency = 'expert';
          else if (roleYears >= 1) proficiency = 'advanced';
          // Add the role as a skill (avoid duplicates)
          if (!roleSkills.find((s)=>s.name === roleTitle)) {
            roleSkills.push({
              name: roleTitle,
              yoe: roleYears,
              proficiency_level: proficiency,
              type: 'role',
              source: 'experience'
            });
            console.log(`[LinkedIn API] Added role skill: "${roleTitle}" (${roleYears}y, ${proficiency})`);
          }
        }
      }
    }
    // Also check current job title from profile header
    if (parsedCandidate.raw_linkedin_profile?.jobTitle && !roleSkills.find((s)=>s.name === parsedCandidate.raw_linkedin_profile.jobTitle)) {
      const currentRole = parsedCandidate.raw_linkedin_profile.jobTitle.trim();
      const currentYears = parsedCandidate.raw_linkedin_profile.currentJobDurationInYrs || 0;
      let proficiency = 'beginner';
      if (currentYears >= 3) proficiency = 'expert';
      else if (currentYears >= 1) proficiency = 'advanced';
      roleSkills.push({
        name: currentRole,
        yoe: currentYears,
        proficiency_level: proficiency,
        type: 'role',
        source: 'current'
      });
      console.log(`[LinkedIn API] Added current role: "${currentRole}" (${currentYears}y, ${proficiency})`);
    }
    // Combine parsed skills with extracted role skills
    const allSkills = [
      ...skills,
      ...roleSkills
    ];
    console.log(`[LinkedIn API] Total skills after role extraction: ${allSkills.length} (${roleSkills.length} roles added)`);
    const candidate = {
      firstName: parsedCandidate.main?.first_name || 'Unknown',
      lastName: parsedCandidate.main?.last_name || '',
      email: parsedCandidate.main?.email,
      yearsOfExperience: parsedCandidate.years_of_experience || 0,
      skills: allSkills.map((skill)=>({
          name: skill.name,
          yearsOfExperience: skill.yoe,
          proficiencyLevel: skill.proficiency_level,
          type: skill.type,
          source: skill.source || 'parsed'
        }))
    };
    console.log(`[LinkedIn API] Converted ${candidate.skills.length} total skills (including roles)`);
    // Step 1.5: Detect candidate seniority from LinkedIn profile
    const extractedTitles = linkedInProfile?.experiences?.map((exp)=>exp.title).filter(Boolean) || [];
    const extractedRoles = linkedInProfile?.experiences?.map((exp)=>({
        title: exp.title,
        duration: exp.caption ? parseLinkedInDuration(exp.caption) : undefined
      })).filter((role)=>role.title) || [];
    console.log('[LinkedIn API] Seniority Detection Input:', {
      currentTitle: linkedInProfile?.jobTitle || 'Not available',
      extractedTitles: extractedTitles,
      candidateYearsOfExperience: candidate.yearsOfExperience,
      linkedInExperienceCount: linkedInProfile?.experiences?.length || 0,
      rolesWithDuration: extractedRoles.map((role)=>({
          title: role.title,
          durationMonths: role.duration || 'Unknown'
        }))
    });
    const candidateSeniority = detectCandidateSeniority({
      currentTitle: linkedInProfile?.jobTitle,
      titles: extractedTitles,
      yearsOfExperience: candidate.yearsOfExperience,
      roles: extractedRoles
    });
    console.log('[LinkedIn API] Seniority Detection Result:', {
      detectedLevel: candidateSeniority.level,
      confidence: candidateSeniority.confidence,
      source: candidateSeniority.source,
      candidateYears: candidateSeniority.yearsOfExperience,
      detectionMethod: candidateSeniority.source
    });
    // Step 2: Format job requirements for unified engine (with null safety)
    const formattedRequirements = jobRequirements.filter((req)=>req && req.requirement) // Filter out null/undefined requirements
    .map((req)=>({
        id: req.requirement,
        name: req.requirement,
        yearsRequired: req.years_of_experience || null,
        proficiencyRequired: req.proficiency_level,
        importance: req.is_mandatory ? 'mandatory' : 'optional',
        category: req.type || 'technical_skill'
      }));
    console.log('[LinkedIn API] Formatted requirements:', {
      originalCount: jobRequirements.length,
      filteredCount: formattedRequirements.length,
      sample: formattedRequirements.slice(0, 3).map((req)=>({
          name: req.name,
          category: req.category
        }))
    });
    // Step 3: Run unified analysis with parsed candidate
    const rawData = {
      linkedInProfile,
      linkedInUrl: parsedCandidate.linkedin_url
    };
    const analysisResult = await analyzeCandidate(candidate, {
      id: jobInfo.id || 'temp-job-id',
      title: jobInfo.title,
      company: jobInfo.company || 'Unknown Company',
      requirements: formattedRequirements
    }, rawData, {
      useSemanticFallback: true,
      analysisVersion: 'linkedin-v2.0-unified'
    });
    // Step 3.5: Perform seniority matching
    const requiredSeniorityLevel = job?.attributes?.seniority_level || null;
    console.log('[LinkedIn API] Seniority Matching Input:', {
      jobTitle: job?.attributes?.title,
      requiredSeniorityLevel: requiredSeniorityLevel,
      candidateDetectedLevel: candidateSeniority.level,
      candidateYears: candidateSeniority.yearsOfExperience,
      matchingEnabled: requiredSeniorityLevel !== null
    });
    const seniorityMatchResult = matchSeniority(candidateSeniority.level, requiredSeniorityLevel, candidateSeniority.yearsOfExperience);
    console.log('[LinkedIn API] Seniority Matching Result:', {
      required: seniorityMatchResult.required,
      candidate: seniorityMatchResult.candidate,
      isMatch: seniorityMatchResult.match,
      matchScore: seniorityMatchResult.score,
      isOverqualified: seniorityMatchResult.isOverqualified,
      isUnderqualified: seniorityMatchResult.isUnderqualified,
      feedback: seniorityMatchResult.feedback
    });
    // Apply seniority penalty to overall score if there's a mismatch
    let adjustedScore = analysisResult.overallScore.totalScore;
    let adjustedCategory = analysisResult.overallScore.category;
    console.log('[LinkedIn API] Score Adjustment Input:', {
      originalScore: analysisResult.overallScore.totalScore,
      originalCategory: analysisResult.overallScore.category,
      seniorityScore: seniorityMatchResult.score,
      requiresPenalty: seniorityMatchResult.required && seniorityMatchResult.score < 0.8,
      penaltyThreshold: 0.8,
      penaltyWeight: 0.3
    });
    if (seniorityMatchResult.required && seniorityMatchResult.score < 0.8) {
      adjustedScore = applySeniorityPenalty(analysisResult.overallScore.totalScore, seniorityMatchResult.score, 0.3 // 30% weight for seniority
      );
      adjustedCategory = adjustCategoryForSeniority(analysisResult.overallScore.category, seniorityMatchResult.score);
      console.log('[LinkedIn API] Score Adjustment Applied:', {
        originalScore: analysisResult.overallScore.totalScore,
        adjustedScore: adjustedScore,
        scoreDifference: analysisResult.overallScore.totalScore - adjustedScore,
        penaltyPercentage: ((analysisResult.overallScore.totalScore - adjustedScore) / analysisResult.overallScore.totalScore * 100).toFixed(1) + '%',
        originalCategory: analysisResult.overallScore.category,
        adjustedCategory: adjustedCategory,
        categoryChanged: analysisResult.overallScore.category !== adjustedCategory
      });
    } else {
      console.log('[LinkedIn API] No Score Adjustment:', {
        reason: seniorityMatchResult.required ? 'Seniority score above penalty threshold' : 'No seniority requirement specified',
        finalScore: adjustedScore,
        finalCategory: adjustedCategory
      });
    }
    // Update analysis result with adjusted values
    analysisResult.overallScore.totalScore = adjustedScore;
    analysisResult.overallScore.category = adjustedCategory;
    // Step 4: Generate narrative outputs using dedicated module
    console.log('[LinkedIn API] Generating narrative outputs...');
    const narrativeOutputs = await generateNarrativeOutputs(analysisResult, jobInfo.title, {
      focusOnProficiency: true,
      includeInterviewStrategy: true,
      maxStrengths: 5,
      maxGaps: 5,
      maxRecommendations: 4
    });
    // Add seniority-specific recommendations
    const seniorityRecommendations = generateSeniorityRecommendations(seniorityMatchResult);
    if (seniorityRecommendations.length > 0) {
      // Merge with existing recommendations, prioritizing seniority insights
      narrativeOutputs.recruiter_recommendations.interview_strategy = [
        ...seniorityRecommendations,
        ...narrativeOutputs.recruiter_recommendations.interview_strategy
      ].slice(0, 6) // Keep max 6 recommendations
      ;
    }
    // Step 5: Format response for backward compatibility  
    const response = formatLinkedInResponse(analysisResult, candidate, linkedInProfile, narrativeOutputs, seniorityMatchResult);
    console.log('[LinkedIn API] Analysis complete:', {
      score: analysisResult.overallScore.totalScore,
      category: analysisResult.overallScore.category
    });
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[LinkedIn API] Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
/**
 * Parse LinkedIn duration string (e.g., "2 yrs 3 mos") into months
 */ function parseLinkedInDuration(caption) {
  let totalMonths = 0;
  const yearMatch = caption.match(/(\d+)\s*yr/);
  const monthMatch = caption.match(/(\d+)\s*mo/);
  if (yearMatch) {
    totalMonths += parseInt(yearMatch[1]) * 12;
  }
  if (monthMatch) {
    totalMonths += parseInt(monthMatch[1]);
  }
  return totalMonths;
}
/**
 * Format response for backward compatibility with existing frontend
 */ function formatLinkedInResponse(analysisResult, candidate, linkedInProfile, narrativeOutputs, seniorityMatchResult) {
  // Count mandatory requirements for frontend compatibility
  const mandatoryMatches = analysisResult.detailedMatches.mandatory;
  const totalMandatory = mandatoryMatches.length;
  const matchedMandatory = mandatoryMatches.filter((match)=>match.category === 'fit').length;
  const response = {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
      linkedInUrl: linkedInProfile.url || linkedInProfile.publicUrl,
      skills: candidate.skills,
      experience: analysisResult.candidateInfo.yearsOfExperience
    },
    match_analysis: {
      overall_score: analysisResult.overallScore.totalScore,
      status: analysisResult.overallScore.category,
      overall_feedback: narrativeOutputs.overall_feedback,
      matched_mandatory_requirements: matchedMandatory,
      total_mandatory_requirements: totalMandatory
    },
    requirement_evaluations: narrativeOutputs.requirement_evaluations,
    summary: narrativeOutputs.summary,
    recruiter_recommendations: narrativeOutputs.recruiter_recommendations,
    metadata: {
      analysis_timestamp: new Date().toISOString(),
      job_id: 'temp-job-id',
      candidate_id: analysisResult.candidateInfo.id || 'temp-candidate-id',
      algorithm_version: 'linkedin-v2.0-unified',
      total_processing_time_ms: analysisResult.metadata?.processingTime || 0
    }
  };
  // Add seniority analysis if performed
  if (seniorityMatchResult) {
    response.seniority_analysis = {
      required: seniorityMatchResult.required,
      candidate: seniorityMatchResult.candidate,
      candidateYears: seniorityMatchResult.candidateYears,
      match: seniorityMatchResult.match,
      score: seniorityMatchResult.score,
      feedback: seniorityMatchResult.feedback
    };
  }
  return response;
}
