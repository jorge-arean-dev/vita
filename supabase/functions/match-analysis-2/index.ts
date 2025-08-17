// Enhanced Match Analysis API v2
// Supabase Edge Function with semantic matching and qualitative analysis
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Types based on actual database schema
interface CandidateSkill {
  name: string;
  type: 'technical_skill' | 'soft_skill' | 'role' | 'certification' | 'industry' | 'technology_domain';
  yoe: number | null;
  proficiency_level: 'beginner' | 'advanced' | 'expert' | null;
}

interface JobRequirement {
  requirement: string;
  type: string;
  is_mandatory: boolean;
  proficiency_level: 'beginner' | 'advanced' | 'expert';
  weight: number;
}

interface LinkedInProfile {
  firstName: string;
  lastName: string;
  about: string;
  headline: string;
  experiences: Array<{
    title: string;
    subtitle: string;
    caption: string;
    description: string;
  }>;
  skills: Array<{
    title: string;
    subComponents: Array<{
      description: Array<{
        type: string;
        text: string;
      }>;
    }>;
  }>;
  recommendations: Array<{
    section_name: string;
    section_components: Array<{
      subComponents: Array<{
        fixedListComponent: Array<{
          text: string;
        }>;
      }>;
    }>;
  }>;
}

interface SkillMatch {
  skill: string;
  match_type: 'exact' | 'semantic' | 'inferred';
  similarity: number;
  source: 'linkedin_skills' | 'experience_description' | 'qualitative_analysis';
  context?: string;
}

interface EnhancedRequirementAnalysis {
  matched_skills: SkillMatch[];
  proficiency_assessment: {
    candidate_level: string;
    required_level: string;
    gap: number;
    years_evidence: number;
  };
  evidence: string[];
  confidence: number;
}

// Proficiency level mapping
const proficiencyLevels = {
  'beginner': 1,
  'advanced': 2,
  'expert': 3
};

// Years of experience thresholds
function getYoeThreshold(proficiencyLevel: string): number {
  switch(proficiencyLevel) {
    case 'beginner': return 1;
    case 'advanced': return 3.5;
    case 'expert': return 6;
    default: return 1;
  }
}

// Generate OpenAI embedding for skill text
async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Get or create cached embedding
async function getCachedEmbedding(text: string, supabase: any, openaiApiKey: string): Promise<number[]> {
  try {
    // Try to get from cache first
    const { data: cached, error } = await supabase
      .from('skill_embeddings')
      .select('embedding')
      .eq('skill_text', text.toLowerCase().trim())
      .single();

    if (!error && cached?.embedding) {
      return cached.embedding;
    }

    // Generate new embedding
    const embedding = await generateEmbedding(text, openaiApiKey);
    
    // Cache it
    await supabase
      .from('skill_embeddings')
      .insert({
        skill_text: text.toLowerCase().trim(),
        embedding: embedding,
        model_version: 'text-embedding-3-small'
      });

    return embedding;
  } catch (error) {
    console.error('Error with cached embedding:', error);
    // Fallback: generate without caching
    return await generateEmbedding(text, openaiApiKey);
  }
}

// Find semantic skill matches
async function findSemanticMatches(
  candidateSkills: CandidateSkill[],
  requirement: string,
  supabase: any,
  openaiApiKey: string,
  threshold: number = 0.75
): Promise<SkillMatch[]> {
  try {
    const matches: SkillMatch[] = [];
    const requirementEmbedding = await getCachedEmbedding(requirement, supabase, openaiApiKey);

    for (const skill of candidateSkills) {
      try {
        const skillEmbedding = await getCachedEmbedding(skill.name, supabase, openaiApiKey);
        const similarity = cosineSimilarity(requirementEmbedding, skillEmbedding);

        if (similarity >= threshold) {
          matches.push({
            skill: skill.name,
            match_type: similarity >= 0.95 ? 'exact' : 'semantic',
            similarity: similarity,
            source: 'linkedin_skills'
          });
        }
      } catch (error) {
        console.error(`Error processing skill ${skill.name}:`, error);
        // Continue with other skills
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error in semantic matching:', error);
    return [];
  }
}

// Perform qualitative analysis on LinkedIn profile
async function performQualitativeAnalysis(
  profile: LinkedInProfile,
  requirements: JobRequirement[],
  openaiApiKey: string
): Promise<any> {
  try {
    const analysisPrompt = `
Analyze this LinkedIn profile and extract:
1. IMPLIED TECHNICAL SKILLS not explicitly listed in skills section
2. SOFT SKILLS with evidence from experience descriptions
3. LEADERSHIP EXPERIENCE with specific examples and team size if mentioned
4. DOMAIN EXPERTISE and industry knowledge

Profile Summary: ${profile.about || ''}
Headline: ${profile.headline || ''}

Work Experience:
${profile.experiences?.map(exp => `
Position: ${exp.title}
Company: ${exp.subtitle}
Duration: ${exp.caption}
Description: ${exp.description}
`).join('\n')}

Job Requirements Context:
${requirements.map(req => `- ${req.requirement} (${req.type})`).join('\n')}

Return a JSON object with this structure:
{
  "implied_skills": [
    {
      "skill": "Database Architecture",
      "type": "technical_skill",
      "evidence": ["Designed scalable database schemas"],
      "confidence": 0.85
    }
  ],
  "soft_skills": [
    {
      "skill": "Cross-functional Communication", 
      "evidence": ["Coordinated with multiple departments"],
      "confidence": 0.80
    }
  ],
  "leadership_indicators": [
    {
      "evidence": "Led team of 5 developers",
      "level": "team_lead",
      "team_size": 5,
      "confidence": 0.90
    }
  ],
  "domain_expertise": [
    {
      "domain": "E-commerce",
      "years_experience": 3,
      "evidence": ["Built e-commerce platform"],
      "confidence": 0.75
    }
  ]
}

Return only valid JSON, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter analyzing LinkedIn profiles. Extract skills and insights from experience descriptions. Return only valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI chat API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.error('No valid JSON found in qualitative analysis response');
      return {
        implied_skills: [],
        soft_skills: [],
        leadership_indicators: [],
        domain_expertise: []
      };
    }

    const jsonStr = content.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error in qualitative analysis:', error);
    return {
      implied_skills: [],
      soft_skills: [],
      leadership_indicators: [],
      domain_expertise: []
    };
  }
}

// Enhanced requirement evaluation
async function evaluateRequirementEnhanced(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[],
  profile: LinkedInProfile,
  qualitativeAnalysis: any,
  supabase: any,
  openaiApiKey: string
): Promise<{
  score: number;
  status: string;
  enhanced_analysis: EnhancedRequirementAnalysis;
}> {
  try {
    console.log(`🔍 Evaluating requirement: ${requirement.requirement}`);
    
    // 1. Find exact matches first
    const exactMatches: SkillMatch[] = [];
    const directMatch = candidateSkills.find(skill => 
      skill.name.toLowerCase() === requirement.requirement.toLowerCase() && 
      skill.type === requirement.type
    );

    if (directMatch) {
      exactMatches.push({
        skill: directMatch.name,
        match_type: 'exact',
        similarity: 1.0,
        source: 'linkedin_skills'
      });
    }

    // 2. Find semantic matches
    const semanticMatches = await findSemanticMatches(
      candidateSkills,
      requirement.requirement,
      supabase,
      openaiApiKey,
      0.75
    );

    // 3. Find inferred matches from qualitative analysis
    const inferredMatches: SkillMatch[] = [];
    qualitativeAnalysis.implied_skills?.forEach((impliedSkill: any) => {
      if (impliedSkill.skill.toLowerCase().includes(requirement.requirement.toLowerCase()) ||
          requirement.requirement.toLowerCase().includes(impliedSkill.skill.toLowerCase())) {
        inferredMatches.push({
          skill: impliedSkill.skill,
          match_type: 'inferred',
          similarity: impliedSkill.confidence,
          source: 'qualitative_analysis',
          context: impliedSkill.evidence[0]
        });
      }
    });

    // 4. Combine all matches
    const allMatches = [...exactMatches, ...semanticMatches, ...inferredMatches];
    
    // 5. Calculate proficiency assessment
    const bestMatch = allMatches[0];
    let candidateSkill = null;
    let candidateLevel = 'beginner';
    let yearsEvidence = 0;

    if (bestMatch?.match_type === 'exact' && directMatch) {
      candidateSkill = directMatch;
      candidateLevel = directMatch.proficiency_level || 'beginner';
      yearsEvidence = directMatch.yoe || 0;
    } else if (bestMatch) {
      // Estimate proficiency from context
      candidateLevel = bestMatch.similarity >= 0.9 ? 'advanced' : 'beginner';
      yearsEvidence = 1; // Default estimate
    }

    // 6. Calculate score using enhanced logic
    let score = 0;
    if (allMatches.length > 0) {
      const candidateValue = proficiencyLevels[candidateLevel as keyof typeof proficiencyLevels] || 1;
      const requiredValue = proficiencyLevels[requirement.proficiency_level] || 1;
      const proficiencyMultiplier = candidateValue / requiredValue;
      
      const requiredYoeThreshold = getYoeThreshold(requirement.proficiency_level);
      const experienceFactor = Math.min(yearsEvidence / Math.max(requiredYoeThreshold, 2), 1.2);
      
      const matchQuality = allMatches[0].similarity;
      const finalScore = Math.min(1.0 * proficiencyMultiplier * experienceFactor * matchQuality, 1.0);
      
      score = Math.round(finalScore * requirement.weight * 100);
    }

    // 7. Determine status
    let status = 'missing';
    if (score >= 75) status = 'strong';
    else if (score >= 50) status = 'adequate';
    else if (score >= 25) status = 'weak';

    // 8. Gather evidence
    const evidence = [];
    if (bestMatch?.context) {
      evidence.push(bestMatch.context);
    }
    if (directMatch && profile.experiences) {
      profile.experiences.forEach(exp => {
        if (exp.description.toLowerCase().includes(requirement.requirement.toLowerCase())) {
          evidence.push(`${exp.title}: ${exp.description.substring(0, 100)}...`);
        }
      });
    }

    // 9. Calculate confidence
    let confidence = 0.5; // Default
    if (exactMatches.length > 0) confidence = 0.9;
    else if (semanticMatches.length > 0) confidence = semanticMatches[0].similarity * 0.8;
    else if (inferredMatches.length > 0) confidence = inferredMatches[0].similarity * 0.6;

    const enhanced_analysis: EnhancedRequirementAnalysis = {
      matched_skills: allMatches.slice(0, 5), // Top 5 matches
      proficiency_assessment: {
        candidate_level: candidateLevel,
        required_level: requirement.proficiency_level,
        gap: (proficiencyLevels[candidateLevel as keyof typeof proficiencyLevels] || 1) - proficiencyLevels[requirement.proficiency_level],
        years_evidence: yearsEvidence
      },
      evidence: evidence.slice(0, 3), // Top 3 evidence items
      confidence: confidence
    };

    console.log(`✅ Requirement ${requirement.requirement}: ${score}% (${status}), ${allMatches.length} matches`);

    return {
      score,
      status,
      enhanced_analysis
    };
  } catch (error) {
    console.error(`Error evaluating requirement ${requirement.requirement}:`, error);
    return {
      score: 0,
      status: 'missing',
      enhanced_analysis: {
        matched_skills: [],
        proficiency_assessment: {
          candidate_level: 'beginner',
          required_level: requirement.proficiency_level,
          gap: -1,
          years_evidence: 0
        },
        evidence: [],
        confidence: 0
      }
    };
  }
}

// Generate AI feedback (reusing existing logic)
async function generateAIFeedback(candidateData: any, jobData: any, requirementEvaluations: any[], openaiApiKey: string) {
  try {
    const candidateName = `${candidateData.main.first_name} ${candidateData.main.last_name}`;
    const jobTitle = jobData.attributes.title;
    
    const evaluationSummary = requirementEvaluations.map(evaluation => ({
      requirement: evaluation.requirement_name,
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

IMPORTANT: Return only valid JSON, no additional text. Be specific and actionable in all recommendations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter with deep knowledge of technical skills and hiring processes. Generate specific, actionable insights for recruiters based on candidate-job match analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;
    
    const jsonStart = result.indexOf('{');
    const jsonEnd = result.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON found in AI response");
    }
    
    const jsonStr = result.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return {
      requirement_feedback: [],
      summary: {
        strengths: ["Analysis in progress"],
        gaps: ["Detailed analysis pending"]
      },
      recruiter_recommendations: {
        interview_strategy: ["Conduct comprehensive technical interview"],
        other_options: ["Review candidate manually"]
      }
    };
  }
}

// Main enhanced match analysis function
async function runEnhancedMatchAnalysis(candidateData: any, jobData: any, supabase: any) {
  const startTime = Date.now();
  console.log("🚀 Starting enhanced match analysis");
  console.log(`👤 Candidate: ${candidateData.main.first_name} ${candidateData.main.last_name}`);
  console.log(`💼 Job: ${jobData.attributes?.title}`);
  console.log(`📊 Requirements: ${jobData.requirements.length}`);
  console.log(`🧠 LinkedIn Profile Available: ${!!candidateData.raw_profile}`);

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not found");
  }

  let apiCalls = {
    embeddings: 0,
    chat_completions: 0
  };

  try {
    // 1. Perform qualitative analysis if LinkedIn profile available
    let qualitativeAnalysis = {
      implied_skills: [],
      soft_skills: [],
      leadership_indicators: [],
      domain_expertise: []
    };

    if (candidateData.raw_profile) {
      console.log("🔬 Performing qualitative analysis...");
      qualitativeAnalysis = await performQualitativeAnalysis(
        candidateData.raw_profile,
        jobData.requirements,
        openaiApiKey
      );
      apiCalls.chat_completions++;
      console.log(`✅ Qualitative analysis completed: ${qualitativeAnalysis.implied_skills?.length || 0} implied skills found`);
    }

    // 2. Enhanced requirement evaluations
    console.log("⚡ Starting enhanced requirement evaluations...");
    const enhancedRequirementEvaluations = [];
    
    for (const requirement of jobData.requirements) {
      const enhancedEval = await evaluateRequirementEnhanced(
        requirement,
        candidateData.skills,
        candidateData.raw_profile,
        qualitativeAnalysis,
        supabase,
        openaiApiKey
      );
      
      // Estimate embedding calls (2 per requirement: candidate skill + requirement)
      apiCalls.embeddings += 2;
      
      enhancedRequirementEvaluations.push({
        requirement_name: requirement.requirement,
        type: requirement.type,
        isMandatory: requirement.is_mandatory,
        requiredProficiency: requirement.proficiency_level,
        weight: requirement.weight,
        score: enhancedEval.score,
        status: enhancedEval.status,
        enhanced_analysis: enhancedEval.enhanced_analysis,
        candidateSkill: null // Will be populated for AI feedback
      });
    }

    // 3. Calculate overall metrics (same as original)
    const mandatoryReqs = enhancedRequirementEvaluations.filter(req => req.isMandatory);
    const optionalReqs = enhancedRequirementEvaluations.filter(req => !req.isMandatory);
    
    const calculateWeightedAverage = (requirements: any[]) => {
      if (requirements.length === 0) return 0;
      const totalWeight = requirements.reduce((sum, req) => sum + req.weight, 0);
      const weightedSum = requirements.reduce((sum, req) => sum + req.score * req.weight, 0);
      return weightedSum / totalWeight;
    };
    
    const mandatoryScore = calculateWeightedAverage(mandatoryReqs);
    const optionalScore = calculateWeightedAverage(optionalReqs);
    const overallScore = Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
    
    const getOverallStatus = (score: number) => {
      if (score >= 75) return "strong";
      if (score >= 50) return "adequate";
      if (score >= 25) return "weak";
      return "missing";
    };
    
    const overallStatus = getOverallStatus(overallScore);
    const matchedMandatory = mandatoryReqs.filter(req => req.score >= 50).length;

    // 4. Generate AI content
    console.log("🤖 Generating AI feedback...");
    const aiContent = await generateAIFeedback(
      candidateData,
      jobData,
      enhancedRequirementEvaluations,
      openaiApiKey
    );
    apiCalls.chat_completions++;

    // 5. Build enhanced response (backward compatible + new features)
    const processingTime = Date.now() - startTime;
    const estimatedCost = (apiCalls.embeddings * 0.00002) + (apiCalls.chat_completions * 0.002); // Rough estimate

    const response = {
      // ✅ EXISTING STRUCTURE (backward compatible)
      match_analysis: {
        overall_score: overallScore,
        status: overallStatus,
        overall_feedback: getOverallFeedback(overallStatus),
        matched_mandatory_requirements: matchedMandatory,
        total_mandatory_requirements: mandatoryReqs.length
      },
      requirement_evaluations: enhancedRequirementEvaluations.map((evaluation, index) => ({
        requirement_name: evaluation.requirement_name,
        score: evaluation.score,
        status: evaluation.status,
        feedback: aiContent.requirement_feedback.find((f: any) => 
          f.requirement === evaluation.requirement_name
        )?.feedback || "Enhanced analysis completed",
        
        // 🆕 NEW: Enhanced analysis data
        enhanced_analysis: evaluation.enhanced_analysis
      })),
      summary: aiContent.summary,
      recruiter_recommendations: aiContent.recruiter_recommendations,
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        job_id: "placeholder_job_id",
        candidate_id: "placeholder_candidate_id", 
        algorithm_version: "2.0-enhanced",
        total_processing_time_ms: processingTime,
        
        // 🆕 NEW: Enhanced metadata
        enhanced_features: {
          semantic_analysis_enabled: true,
          qualitative_analysis_enabled: !!candidateData.raw_profile,
          openai_calls: apiCalls,
          cost_estimate_usd: estimatedCost,
          confidence_factors: {
            profile_completeness: candidateData.raw_profile ? 0.9 : 0.6,
            skill_extraction_quality: 0.85,
            semantic_matching_quality: 0.8
          }
        }
      },
      
      // 🆕 NEW: Enhanced insights section
      enhanced_insights: {
        discovered_skills: qualitativeAnalysis.implied_skills?.map((skill: any) => ({
          skill: skill.skill,
          type: skill.type,
          confidence: skill.confidence,
          evidence: skill.evidence
        })) || [],
        semantic_matches: enhancedRequirementEvaluations.flatMap(req => 
          req.enhanced_analysis.matched_skills
            .filter((match: SkillMatch) => match.match_type === 'semantic')
            .map((match: SkillMatch) => ({
              requirement: req.requirement_name,
              candidate_skill: match.skill,
              similarity: match.similarity,
              match_type: match.match_type
            }))
        ),
        qualitative_analysis: {
          leadership_indicators: qualitativeAnalysis.leadership_indicators || [],
          soft_skills_discovered: qualitativeAnalysis.soft_skills?.map((skill: any) => ({
            skill: skill.skill,
            evidence: skill.evidence,
            confidence: skill.confidence
          })) || [],
          domain_expertise: qualitativeAnalysis.domain_expertise || []
        }
      }
    };

    // 6. Console logging for testing
    console.log("\n🎯 ENHANCED MATCH ANALYSIS RESULTS:");
    console.log("=====================================");
    console.log(`📊 Overall Score: ${overallScore}% (${overallStatus})`);
    console.log(`✅ Mandatory Requirements Met: ${matchedMandatory}/${mandatoryReqs.length}`);
    console.log(`🕒 Processing Time: ${processingTime}ms`);
    console.log(`💰 Estimated Cost: $${estimatedCost.toFixed(4)}`);
    console.log(`🔧 API Calls: ${apiCalls.embeddings} embeddings, ${apiCalls.chat_completions} chat`);
    console.log(`🧠 Discovered Skills: ${response.enhanced_insights.discovered_skills.length}`);
    console.log(`🎯 Semantic Matches: ${response.enhanced_insights.semantic_matches.length}`);
    console.log(`👑 Leadership Indicators: ${response.enhanced_insights.qualitative_analysis.leadership_indicators.length}`);
    
    console.log("\n📋 REQUIREMENT BREAKDOWN:");
    enhancedRequirementEvaluations.forEach((req, i) => {
      console.log(`${i + 1}. ${req.requirement_name}: ${req.score}% (${req.status}) - ${req.enhanced_analysis.matched_skills.length} matches`);
    });
    
    console.log("\n🔍 ENHANCED INSIGHTS SAMPLE:");
    if (response.enhanced_insights.discovered_skills.length > 0) {
      console.log("Discovered Skills:", response.enhanced_insights.discovered_skills.slice(0, 3));
    }
    if (response.enhanced_insights.semantic_matches.length > 0) {
      console.log("Top Semantic Matches:", response.enhanced_insights.semantic_matches.slice(0, 3));
    }

    return response;
  } catch (error) {
    console.error("❌ Enhanced match analysis error:", error);
    throw error;
  }
}

// Helper function for overall feedback
function getOverallFeedback(status: string): string {
  switch(status) {
    case "strong":
      return "This candidate is well-suited for this position and should be presented.";
    case "adequate":
      return "Please consider reviewing and confirming some aspects before proceeding.";
    case "weak":
      return "This candidate may not be a strong fit; further review is recommended before proceeding.";
    case "missing":
      return "This candidate is not a good fit; consider other options unless more information becomes available.";
    default:
      return "Enhanced analysis complete - please review results.";
  }
}

// Main Edge Function handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log("🎬 Enhanced Match Analysis API v2 - Starting");
    const startTime = Date.now();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData = await req.json();
    
    if (!requestData.candidate || !requestData.job) {
      return new Response(JSON.stringify({
        error: "Invalid input. Expected object with 'candidate' and 'job' properties."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { candidate, job } = requestData;

    // Validate candidate data
    if (!candidate.main || !candidate.skills || !Array.isArray(candidate.skills)) {
      return new Response(JSON.stringify({
        error: "Invalid candidate data. Must contain 'main' and 'skills' array."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate job data
    if (!job.requirements || !Array.isArray(job.requirements) || job.requirements.length === 0) {
      return new Response(JSON.stringify({
        error: "Invalid job data. Must contain non-empty 'requirements' array."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Processing: ${candidate.main.first_name} ${candidate.main.last_name} vs ${job.attributes?.title}`);
    console.log(`📋 Requirements: ${job.requirements.length}, LinkedIn Profile: ${!!candidate.raw_profile ? 'Yes' : 'No'}`);

    // Run enhanced analysis
    const result = await runEnhancedMatchAnalysis(candidate, job, supabase);
    
    // Update timing
    result.metadata.total_processing_time_ms = Date.now() - startTime;

    console.log(`✅ Enhanced analysis completed in ${result.metadata.total_processing_time_ms}ms`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Enhanced match analysis error:", error);
    return new Response(JSON.stringify({
      error: 'Enhanced analysis failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});