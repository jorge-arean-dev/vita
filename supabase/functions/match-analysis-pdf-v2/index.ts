/**
 * PDF Resume Match Analysis API
 * Processes resume text using unified matching engine
 * 
 * Updated: 2025-01-04 23:55 - Deployed with enhanced role matching capabilities
 * - Now benefits from improved role-type skill matching
 * - Includes role qualification checks (e.g., CTO qualifies for Tech Lead)
 * - Uses updated skill registry with comprehensive role aliases
 * - Compatible with role extraction from parse-resume-skill.js
 */ import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 import { analyzeCandidate } from '../_shared/core-matching-engine.ts';
 import { mapYOEToProficiency } from '../_shared/proficiency-calculator.ts';
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
 // OpenAI configuration
 const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
 serve(async (req)=>{
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', {
       headers: corsHeaders
     });
   }
   try {
     // Parse request body - expecting legacy format { candidate, job }
     const { candidate: candidateData, job } = await req.json();
     console.log('[PDF API] Received candidate data');
     console.log('[PDF API] Candidate structure:', {
       hasMain: !!candidateData?.main,
       mainName: `${candidateData?.main?.first_name} ${candidateData?.main?.last_name}`,
       skillsCount: candidateData?.skills?.length || 0,
       yearsExp: candidateData?.years_of_experience,
       hasPdfText: !!candidateData?.raw_pdf_profile_text
     });
     // Extract data from legacy format
     const resumeText = candidateData?.raw_pdf_profile_text;
     const jobRequirements = job?.requirements || [];
     const jobInfo = {
       id: 'temp-job-id',
       title: job?.attributes?.title || 'Unknown Position',
       company: job?.attributes?.company || 'Unknown Company'
     };
     // Validate required fields
     if (!candidateData || !candidateData.skills) {
       throw new Error('Candidate data with skills is required');
     }
     if (!resumeText) {
       throw new Error('PDF resume text is required in raw_pdf_profile_text field');
     }
     if (!jobRequirements || !Array.isArray(jobRequirements)) {
       throw new Error('Job requirements array is required');
     }
     if (!job || !job.attributes || !job.attributes.title) {
       throw new Error('Job information is required');
     }
     console.log('[PDF API] Processing resume for job:', jobInfo.title);
     // Step 1: Convert candidate data to unified format
     const skills = candidateData.skills || [];
     console.log('[PDF API] Converting skills:', skills.length, 'skills found');
     const candidate = {
       firstName: candidateData.main?.first_name || 'Unknown',
       lastName: candidateData.main?.last_name || '',
       email: candidateData.main?.email,
       yearsOfExperience: candidateData.years_of_experience || 0,
       skills: skills.map((skill)=>({
           name: skill.name,
           yearsOfExperience: skill.yoe,
           proficiencyLevel: skill.proficiency_level,
           type: skill.type,
           source: skill.source || 'parsed'
         }))
     };
     console.log(`[PDF API] Converted ${candidate.skills.length} parsed skills`);
     // Step 2: Extract additional skills from resume text if available
     if (resumeText) {
       console.log('[PDF API] Extracting additional skills from resume text');
       const additionalSkills = await extractSkillsFromResume(resumeText);
       const mergedSkills = mergeSkills(candidate.skills, additionalSkills);
       candidate.skills = mergedSkills;
       console.log(`[PDF API] Total skills after extraction: ${candidate.skills.length}`);
     }
     // Step 2.5: Detect candidate seniority from resume data
     const extractedTitles = extractJobTitlesFromResume(resumeText, candidate.skills);
     const roleSkills = candidate.skills.filter((skill)=>skill.type === 'role');
     const extractedRoles = roleSkills.map((skill)=>({
         title: skill.name,
         duration: skill.yearsOfExperience ? skill.yearsOfExperience * 12 : undefined
       }));
     console.log('[PDF API] Seniority Detection Input:', {
       currentTitle: candidateData.main?.job_title || candidateData.main?.current_position || 'Not available',
       extractedTitlesFromResume: extractedTitles,
       roleSkillsCount: roleSkills.length,
       candidateYearsOfExperience: candidate.yearsOfExperience,
       resumeTextLength: resumeText?.length || 0,
       rolesWithDuration: extractedRoles.map((role)=>({
           title: role.title,
           durationMonths: role.duration || 'Unknown'
         }))
     });
     const candidateSeniority = detectCandidateSeniority({
       currentTitle: candidateData.main?.job_title || candidateData.main?.current_position,
       titles: extractedTitles,
       yearsOfExperience: candidate.yearsOfExperience,
       roles: extractedRoles
     });
     console.log('[PDF API] Seniority Detection Result:', {
       detectedLevel: candidateSeniority.level,
       confidence: candidateSeniority.confidence,
       source: candidateSeniority.source,
       candidateYears: candidateSeniority.yearsOfExperience,
       detectionMethod: candidateSeniority.source
     });
     // Step 3: Format job requirements for unified engine
     const formattedRequirements = jobRequirements.map((req)=>({
         id: req.requirement,
         skill: req.requirement,
         yearsRequired: req.years_of_experience || null,
         proficiencyRequired: req.proficiency_level,
         importance: req.is_mandatory ? 'mandatory' : 'optional',
         category: req.type || 'technical_skill'
       }));
     // Step 4: Run unified analysis with PDF data
     const rawData = {
       resumeText,
       resumeUrl: candidateData.resume_url
     };
     const analysisResult = await analyzeCandidate(candidate, {
       id: jobInfo.id || 'temp-job-id',
       title: jobInfo.title,
       company: jobInfo.company || 'Unknown Company',
       requirements: formattedRequirements
     }, rawData, {
       useSemanticFallback: true,
       analysisVersion: 'pdf-v2.0-unified'
     });
     // Step 4.5: Perform seniority matching
     const requiredSeniorityLevel = job?.attributes?.seniorityLevel || null;
     console.log('[PDF API] Seniority Matching Input:', {
       jobTitle: job?.attributes?.title,
       requiredSeniorityLevel: requiredSeniorityLevel,
       candidateDetectedLevel: candidateSeniority.level,
       candidateYears: candidateSeniority.yearsOfExperience,
       matchingEnabled: requiredSeniorityLevel !== null
     });
     const seniorityMatchResult = matchSeniority(candidateSeniority.level, requiredSeniorityLevel, candidateSeniority.yearsOfExperience);
     console.log('[PDF API] Seniority Matching Result:', {
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
     console.log('[PDF API] Score Adjustment Input:', {
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
       console.log('[PDF API] Score Adjustment Applied:', {
         originalScore: analysisResult.overallScore.totalScore,
         adjustedScore: adjustedScore,
         scoreDifference: analysisResult.overallScore.totalScore - adjustedScore,
         penaltyPercentage: ((analysisResult.overallScore.totalScore - adjustedScore) / analysisResult.overallScore.totalScore * 100).toFixed(1) + '%',
         originalCategory: analysisResult.overallScore.category,
         adjustedCategory: adjustedCategory,
         categoryChanged: analysisResult.overallScore.category !== adjustedCategory
       });
     } else {
       console.log('[PDF API] No Score Adjustment:', {
         reason: seniorityMatchResult.required ? 'Seniority score above penalty threshold' : 'No seniority requirement specified',
         finalScore: adjustedScore,
         finalCategory: adjustedCategory
       });
     }
     // Update analysis result with adjusted values
     analysisResult.overallScore.totalScore = adjustedScore;
     analysisResult.overallScore.category = adjustedCategory;
     // Step 5: Generate narrative outputs using dedicated module
     console.log('[PDF API] Generating narrative outputs...');
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
     // Step 6: Format response for backward compatibility  
     const response = formatPDFResponse(analysisResult, candidate, resumeText, narrativeOutputs, seniorityMatchResult);
     console.log('[PDF API] Analysis complete:', {
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
     console.error('[PDF API] Error:', error);
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
  * Extract skills from resume text using LLM
  */ async function extractSkillsFromResume(resumeText) {
   try {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${OPENAI_API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         model: 'gpt-4o-mini',
         temperature: 0.1,
         messages: [
           {
             role: 'system',
             content: `You are a technical recruiter extracting skills from resumes.
             Extract all technical skills, certifications, and soft skills mentioned.
             For each skill, try to determine years of experience if mentioned.
             
             Return a JSON array with this structure:
             [{
               "name": "skill name",
               "yearsOfExperience": number or null,
               "type": "technical_skill" | "certification" | "soft_skill",
               "context": "brief context where skill was mentioned"
             }]`
           },
           {
             role: 'user',
             content: `Extract skills from this resume:\n\n${resumeText.substring(0, 8000)}`
           }
         ],
         response_format: {
           type: "json_object"
         }
       })
     });
     if (!response.ok) {
       throw new Error('OpenAI API request failed');
     }
     const data = await response.json();
     const result = JSON.parse(data.choices[0].message.content);
     // Convert to CandidateSkill format
     const skills = (result.skills || []).map((skill)=>({
         name: skill.name,
         yearsOfExperience: skill.yearsOfExperience,
         proficiencyLevel: skill.yearsOfExperience ? mapYOEToProficiency(skill.yearsOfExperience) : null,
         type: skill.type || 'technical_skill',
         source: 'resume'
       }));
     return skills;
   } catch (error) {
     console.error('[PDF API] Skill extraction error:', error);
     return [];
   }
 }
 /**
  * Merge extracted skills avoiding duplicates
  */ function mergeSkills(existingSkills, newSkills) {
   const skillMap = new Map();
   // Add existing skills
   for (const skill of existingSkills){
     const key = skill.name.toLowerCase().trim();
     skillMap.set(key, skill);
   }
   // Merge new skills (preferring ones with more data)
   for (const skill of newSkills){
     const key = skill.name.toLowerCase().trim();
     const existing = skillMap.get(key);
     if (!existing || !existing.yearsOfExperience && skill.yearsOfExperience) {
       skillMap.set(key, skill);
     }
   }
   return Array.from(skillMap.values());
 }
 /**
  * Extract job titles from resume text and existing role skills
  * Looks for common patterns in resume text to identify job titles
  */ function extractJobTitlesFromResume(resumeText, skills) {
   const titles = [];
   // Get titles from existing role-type skills
   if (skills) {
     const roleTitles = skills.filter((skill)=>skill.type === 'role').map((skill)=>skill.name).filter(Boolean);
     titles.push(...roleTitles);
   }
   // Extract titles from resume text patterns
   if (resumeText) {
     const commonTitlePatterns = [
       // Job title followed by company/location/dates
       /(?:^|\n)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Engineer|Developer|Manager|Lead|Director|Analyst|Specialist|Designer|Coordinator|Assistant|Associate|Senior|Junior|Principal|Staff|Architect|Consultant|Advisor))+)\s*(?:at\s|[@\-,])/gim,
       // Job title in work experience sections
       /(?:position|role|title):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Engineer|Developer|Manager|Lead|Director|Analyst|Specialist|Designer|Coordinator|Assistant|Associate|Senior|Junior|Principal|Staff|Architect|Consultant|Advisor))+)/gim,
       // Job titles at beginning of lines (common resume format)
       /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Engineer|Developer|Manager|Lead|Director|Analyst|Specialist|Designer|Coordinator|Assistant|Associate|Senior|Junior|Principal|Staff|Architect|Consultant|Advisor))\s*$/gim
     ];
     for (const pattern of commonTitlePatterns){
       let match;
       while((match = pattern.exec(resumeText)) !== null){
         const title = match[1].trim();
         if (title && !titles.includes(title)) {
           titles.push(title);
         }
       }
     }
   }
   return titles.slice(0, 5) // Limit to top 5 most relevant titles
   ;
 }
 /**
  * Format response for backward compatibility with existing frontend
  */ function formatPDFResponse(analysisResult, candidate, resumeText, narrativeOutputs, seniorityMatchResult) {
   // Count mandatory requirements for frontend compatibility
   // Updated 2025-08-27: Only "fit" (80%+) counts as "met" for expert requirements
   const mandatoryMatches = analysisResult.detailedMatches.mandatory;
   const totalMandatory = mandatoryMatches.length;
   const matchedMandatory = mandatoryMatches.filter((match)=>match.category === 'fit').length;
   const response = {
     success: true,
     candidate: {
       name: analysisResult.candidateInfo.name,
       email: analysisResult.candidateInfo.email,
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
       algorithm_version: 'pdf-v2.0-unified',
       total_processing_time_ms: analysisResult.metadata?.processingTime || 0,
       resume_length: resumeText.length
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
 