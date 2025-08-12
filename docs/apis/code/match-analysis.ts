// supabase/functions/match-analysis/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
// Proficiency level mapping
const proficiencyLevels = {
  'beginner': 1,
  'advanced': 2,
  'expert': 3 // yoe > 5.0 years
};
// Get overall feedback message based on status
function getOverallFeedback(status) {
  switch(status){
    case "strong":
      return "This candidate is well-suited for this position and should be presented.";
    case "adequate":
      return "Please consider reviewing and confirming some aspects before proceeding.";
    case "weak":
      return "This candidate may not be a strong fit; further review is recommended before proceeding.";
    case "missing":
      return "This candidate is not a good fit; consider other options unless more information becomes available.";
    default:
      return "Analysis incomplete - please review manually.";
  }
}
// Expected years of experience thresholds
function getYoeThreshold(proficiencyLevel) {
  switch(proficiencyLevel){
    case 'beginner':
      return 1;
    case 'advanced':
      return 3.5; // Midpoint of 2-5 range
    case 'expert':
      return 6; // Conservative expert threshold
    default:
      return 1;
  }
}
// Calculate individual requirement score
function calculateRequirementScore(candidateSkill, jobRequirement) {
  // Step 1: Check if candidate has the skill
  if (!candidateSkill) {
    return 0; // No skill = 0% score
  }
  // Step 2: Calculate proficiency multiplier based on levels
  const candidateLevel = proficiencyLevels[candidateSkill.proficiency_level] || 0;
  const requiredLevel = proficiencyLevels[jobRequirement.proficiency_level] || 1;
  const proficiencyMultiplier = candidateLevel / requiredLevel;
  // Step 3: Apply experience factor
  const requiredYoeThreshold = getYoeThreshold(jobRequirement.proficiency_level);
  const candidateYoe = candidateSkill.yoe || 0;
  const experienceFactor = Math.min(candidateYoe / Math.max(requiredYoeThreshold, 2), 1.2 // Maximum 20% bonus for extra experience
  );
  // Step 4: Calculate final score
  const finalScore = Math.min(1.0 * proficiencyMultiplier * experienceFactor, 1.0 // Cap at 100%
  );
  // Step 5: Apply requirement weight and convert to percentage
  return Math.round(finalScore * jobRequirement.weight * 100);
}
// Get requirement status based on score
function getRequirementStatus(score) {
  if (score >= 75) return "strong"; // 75-100%
  if (score >= 50) return "adequate"; // 50-74%
  if (score >= 25) return "weak"; // 25-49%
  return "missing"; // 0-24%
}
// Find matching candidate skill for job requirement
function findMatchingSkill(candidateSkills, requirement) {
  // Direct name matching (case insensitive)
  let match = candidateSkills.find((skill)=>skill.name.toLowerCase() === requirement.requirement.toLowerCase() && skill.type === requirement.type);
  if (match) return match;
  // Handle common variations
  const variations = {
    'postgres': [
      'postgresql'
    ],
    'postgresql': [
      'postgres'
    ],
    'mongo': [
      'mongodb'
    ],
    'mongodb': [
      'mongo'
    ],
    'js': [
      'javascript'
    ],
    'javascript': [
      'js'
    ],
    'ts': [
      'typescript'
    ],
    'typescript': [
      'ts'
    ]
  };
  const reqName = requirement.requirement.toLowerCase();
  if (variations[reqName]) {
    for (const variation of variations[reqName]){
      match = candidateSkills.find((skill)=>skill.name.toLowerCase() === variation && skill.type === requirement.type);
      if (match) return match;
    }
  }
  // Technology domain broader matching
  if (requirement.type === 'technology_domain') {
    match = candidateSkills.find((skill)=>skill.name.toLowerCase().includes(reqName) || reqName.includes(skill.name.toLowerCase()));
    if (match) return match;
  }
  return null;
}
// Calculate overall score with 80/20 weighting
function calculateOverallScore(requirementEvaluations) {
  const mandatoryReqs = requirementEvaluations.filter((req)=>req.isMandatory);
  const optionalReqs = requirementEvaluations.filter((req)=>!req.isMandatory);
  const calculateWeightedAverage = (requirements)=>{
    if (requirements.length === 0) return 0;
    const totalWeight = requirements.reduce((sum, req)=>sum + req.weight, 0);
    const weightedSum = requirements.reduce((sum, req)=>sum + req.score * req.weight, 0);
    return weightedSum / totalWeight;
  };
  const mandatoryScore = calculateWeightedAverage(mandatoryReqs);
  const optionalScore = calculateWeightedAverage(optionalReqs);
  // 80/20 weighting (mandatory requirements are more important)
  return Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
}
// Count mandatory requirement matches
function countMandatoryMatches(requirementEvaluations) {
  const mandatoryReqs = requirementEvaluations.filter((req)=>req.isMandatory);
  const matchedReqs = mandatoryReqs.filter((req)=>req.score >= 50); // "adequate" or better
  return {
    matched: matchedReqs.length,
    total: mandatoryReqs.length
  };
}
// Generate AI content for feedback, summary, and recommendations
async function generateAIContent(candidateData, jobData, requirementEvaluations) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not found in environment variables");
  }
  // Prepare data for AI prompt
  const candidateName = `${candidateData.main.first_name} ${candidateData.main.last_name}`;
  const jobTitle = jobData.attributes.title;
  const evaluationSummary = requirementEvaluations.map((evaluation)=>({
      requirement: evaluation.requirement,
      type: evaluation.type,
      is_mandatory: evaluation.isMandatory,
      required_proficiency: evaluation.requiredProficiency,
      score: evaluation.score,
      status: evaluation.status,
      candidate_skill: evaluation.candidateSkill ? {
        proficiency: evaluation.candidateSkill.proficiency_level,
        yoe: evaluation.candidateSkill.yoe
      } : null
    }));
  const prompt = `
You are an expert recruiter analyzing how well a candidate matches a job opening. Based on the technical analysis provided, generate human-readable content for three specific sections.

## CANDIDATE & JOB CONTEXT:
**Candidate**: ${candidateName}
**Position**: ${jobTitle}
**Candidate Experience**: ${candidateData.years_of_experience} years total
**Candidate Skills**: ${JSON.stringify(candidateData.skills, null, 2)}
**Job Requirements**: ${JSON.stringify(jobData.requirements, null, 2)}

## TECHNICAL ANALYSIS RESULTS:
${JSON.stringify(evaluationSummary, null, 2)}

## REQUIRED OUTPUT SECTIONS:

### 1. REQUIREMENT FEEDBACK (Individual explanations for each requirement)
For each requirement evaluation, provide a 1-2 sentence explanation of the score/status that a recruiter can understand. Focus on:
- Why the score was assigned
- What the gap or strength means practically
- Specific context about proficiency levels or experience

### 2. SUMMARY SECTIONS
**Strengths**: 3-5 bullet points highlighting the candidate's best matches and advantages
**Gaps**: 3-5 bullet points identifying the most important skill deficiencies or concerns

### 3. RECRUITER RECOMMENDATIONS
**Interview Strategy**: 3-4 specific actions for how to further evaluate this candidate during the interview process. This may include topics or skills to emphasize/validate during interviews.
**Other Options**: 3-4 suggestions for different ways to present or place this candidate if the direct match isn't perfect

## OUTPUT FORMAT:
Return a valid JSON object with this exact structure:

{
  "requirement_feedback": [
    {
      "requirement": "TypeScript",
      "feedback": "Candidate has beginner-level TypeScript (1 year) but expert level required (5+ years). Significant skill gap identified for senior role."
    }
  ],
  "summary": {
    "strengths": [
      "Strong React and Node.js foundation with 3.5 years experience each"
    ],
    "gaps": [
      "TypeScript proficiency significantly below senior level requirements"
    ]
  },
  "recruiter_recommendations": {
    "interview_strategy": [
      "Dig deeper into TypeScript projects during technical interview"
    ],
    "other_options": [
      "Consider 'Mid-Level with Senior Potential' positioning instead"
    ]
  }
}

IMPORTANT: Return only valid JSON, no additional text. Be specific and actionable in all recommendations.
  `;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert recruiter with deep knowledge of technical skills and hiring processes. Generate specific, actionable insights for recruiters based on candidate-job match analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const result = data.choices[0].message.content;
    // Find and parse JSON from response
    const jsonStart = result.indexOf('{');
    const jsonEnd = result.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON object found in AI response");
    }
    const jsonStr = result.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error(`Error generating AI content: ${error.message}`);
    throw error;
  }
}
// Main match analysis function
async function runMatchAnalysis(candidateData, jobData) {
  console.log("Starting match analysis");
  // Step 1: Process each job requirement
  const requirementEvaluations = jobData.requirements.map((requirement)=>{
    // Find matching candidate skill
    const candidateSkill = findMatchingSkill(candidateData.skills, requirement);
    // Calculate score
    const score = calculateRequirementScore(candidateSkill, requirement);
    // Get status
    const status = getRequirementStatus(score);
    return {
      requirement: requirement.requirement,
      type: requirement.type,
      isMandatory: requirement.is_mandatory,
      requiredProficiency: requirement.proficiency_level,
      weight: requirement.weight,
      score: score,
      status: status,
      candidateSkill: candidateSkill
    };
  });
  // Step 2: Calculate overall metrics
  const overallScore = calculateOverallScore(requirementEvaluations);
  const mandatoryMatches = countMandatoryMatches(requirementEvaluations);
  // Step 2.1: Calculate overall status and feedback
  const overallStatus = getRequirementStatus(overallScore);
  const overallFeedback = getOverallFeedback(overallStatus);
  // Step 3: Generate AI content
  console.log("Generating AI content for feedback and recommendations");
  const aiContent = await generateAIContent(candidateData, jobData, requirementEvaluations);
  // Step 4: Build final response
  const response = {
    match_analysis: {
      overall_score: overallScore,
      status: overallStatus,
      overall_feedback: overallFeedback,
      matched_mandatory_requirements: mandatoryMatches.matched,
      total_mandatory_requirements: mandatoryMatches.total
    },
    requirement_evaluations: requirementEvaluations.map((evaluation, index)=>({
        requirement_name: evaluation.requirement,
        score: evaluation.score,
        status: evaluation.status,
        feedback: aiContent.requirement_feedback.find((f)=>f.requirement === evaluation.requirement)?.feedback || "Analysis pending"
      })),
    summary: aiContent.summary,
    recruiter_recommendations: aiContent.recruiter_recommendations,
    metadata: {
      analysis_timestamp: new Date().toISOString(),
      job_id: "placeholder_job_id",
      candidate_id: "placeholder_candidate_id",
      algorithm_version: "1.0",
      total_processing_time_ms: Date.now() // Will calculate actual time
    }
  };
  console.log("Match analysis completed successfully");
  return response;
}
// Edge Function handler
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    console.log("Match analysis function started");
    const startTime = Date.now();
    // Parse request body
    const requestData = await req.json();
    // Validate input structure
    if (!requestData.candidate || !requestData.job) {
      return new Response(JSON.stringify({
        error: "Invalid input. Expected object with 'candidate' and 'job' properties."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { candidate, job } = requestData;
    // Validate candidate data
    if (!candidate.main || !candidate.skills || !Array.isArray(candidate.skills)) {
      return new Response(JSON.stringify({
        error: "Invalid candidate data. Must contain 'main' and 'skills' array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate job data
    if (!job.requirements || !Array.isArray(job.requirements) || job.requirements.length === 0) {
      return new Response(JSON.stringify({
        error: "Invalid job data. Must contain non-empty 'requirements' array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Processing match analysis for: ${candidate.main.first_name} ${candidate.main.last_name} vs ${job.attributes?.title || 'Unknown Position'}`);
    // Run the match analysis
    const result = await runMatchAnalysis(candidate, job);
    // Update processing time
    result.metadata.total_processing_time_ms = Date.now() - startTime;
    console.log("Analysis completed successfully");
    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Match analysis error: ${error.message}`);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
