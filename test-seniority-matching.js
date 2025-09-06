/**
 * Test Script for Seniority Matching
 * Tests the enhanced match analysis APIs with seniority level matching
 */

const SUPABASE_URL = 'https://klhhdgizxytfmolwabfl.supabase.co'
const EDGE_FUNCTIONS = {
  LinkedIn: `${SUPABASE_URL}/functions/v1/match-analysis-linkedin-v2`,
  PDF: `${SUPABASE_URL}/functions/v1/match-analysis-pdf-v2`,
  Fallback: `${SUPABASE_URL}/functions/v1/match-analysis-fallback-v2`
}

// Test Scenarios
const TEST_SCENARIOS = [
  {
    name: "Perfect Match - Senior to Senior",
    candidate: {
      main: {
        first_name: "John",
        last_name: "Smith"
      },
      skills: [
        { name: "JavaScript", type: "technical_skill", yoe: 6, proficiency_level: "advanced" },
        { name: "React", type: "technical_skill", yoe: 4, proficiency_level: "expert" },
        { name: "Senior Software Engineer", type: "role", yoe: 3, proficiency_level: "expert" }
      ],
      years_of_experience: 6,
      raw_linkedin_profile: {
        jobTitle: "Senior Software Engineer",
        experiences: [
          {
            title: "Senior Software Engineer",
            caption: "2 yrs 6 mos"
          },
          {
            title: "Software Engineer",
            caption: "3 yrs 2 mos"
          }
        ]
      }
    },
    job: {
      attributes: {
        title: "Senior Full Stack Developer",
        seniorityLevel: "senior"
      },
      requirements: [
        { requirement: "JavaScript", type: "technical_skill", is_mandatory: true, proficiency_level: "advanced" },
        { requirement: "React", type: "technical_skill", is_mandatory: true, proficiency_level: "advanced" }
      ]
    },
    expectedSeniority: {
      candidate: "senior",
      required: "senior",
      match: true,
      scoreRange: [0.8, 1.0]
    }
  },

  {
    name: "Underqualified - Junior to Senior",
    candidate: {
      main: {
        first_name: "Alice",
        last_name: "Johnson"
      },
      skills: [
        { name: "JavaScript", type: "technical_skill", yoe: 1, proficiency_level: "beginner" },
        { name: "Junior Developer", type: "role", yoe: 1, proficiency_level: "beginner" }
      ],
      years_of_experience: 1,
      raw_linkedin_profile: {
        jobTitle: "Junior Software Developer",
        experiences: [
          {
            title: "Junior Software Developer",
            caption: "1 yr 2 mos"
          }
        ]
      }
    },
    job: {
      attributes: {
        title: "Senior Backend Engineer",
        seniorityLevel: "senior"
      },
      requirements: [
        { requirement: "JavaScript", type: "technical_skill", is_mandatory: true, proficiency_level: "expert" }
      ]
    },
    expectedSeniority: {
      candidate: "junior",
      required: "senior",
      match: false,
      scoreRange: [0.1, 0.4]
    }
  },

  {
    name: "Overqualified - Senior to Junior",
    candidate: {
      main: {
        first_name: "Bob",
        last_name: "Wilson"
      },
      skills: [
        { name: "JavaScript", type: "technical_skill", yoe: 8, proficiency_level: "expert" },
        { name: "Tech Lead", type: "role", yoe: 3, proficiency_level: "expert" }
      ],
      years_of_experience: 8,
      raw_linkedin_profile: {
        jobTitle: "Tech Lead",
        experiences: [
          {
            title: "Tech Lead",
            caption: "3 yrs 1 mo"
          },
          {
            title: "Senior Software Engineer", 
            caption: "4 yrs 6 mos"
          }
        ]
      }
    },
    job: {
      attributes: {
        title: "Junior Frontend Developer",
        seniorityLevel: "junior"
      },
      requirements: [
        { requirement: "JavaScript", type: "technical_skill", is_mandatory: true, proficiency_level: "beginner" }
      ]
    },
    expectedSeniority: {
      candidate: "lead",
      required: "junior",
      match: true, // Overqualified still counts as match
      scoreRange: [0.4, 0.8] // But with warnings about overqualification
    }
  },

  {
    name: "No Seniority Requirement",
    candidate: {
      main: {
        first_name: "Carol",
        last_name: "Davis"
      },
      skills: [
        { name: "Python", type: "technical_skill", yoe: 3, proficiency_level: "advanced" }
      ],
      years_of_experience: 3,
      raw_linkedin_profile: {
        jobTitle: "Software Developer",
        experiences: [
          {
            title: "Software Developer",
            caption: "3 yrs"
          }
        ]
      }
    },
    job: {
      attributes: {
        title: "Full Stack Developer",
        seniorityLevel: null // No seniority requirement
      },
      requirements: [
        { requirement: "Python", type: "technical_skill", is_mandatory: true, proficiency_level: "intermediate" }
      ]
    },
    expectedSeniority: {
      candidate: "mid",
      required: null,
      match: true,
      scoreRange: [1.0, 1.0] // No penalty when no requirement
    }
  }
]

async function testEdgeFunction(functionName, endpoint, scenario) {
  console.log(`\n🧪 Testing ${functionName}: ${scenario.name}`)
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.SUPABASE_ANON_KEY || 'your-anon-key-here')
      },
      body: JSON.stringify(scenario)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    
    // Validate seniority analysis
    if (result.seniority_analysis) {
      console.log('✅ Seniority Analysis Found:')
      console.log(`   Required: ${result.seniority_analysis.required}`)
      console.log(`   Candidate: ${result.seniority_analysis.candidate}`) 
      console.log(`   Match: ${result.seniority_analysis.match}`)
      console.log(`   Score: ${result.seniority_analysis.score}`)
      console.log(`   Feedback: ${result.seniority_analysis.feedback}`)
      
      // Validate expectations
      const expected = scenario.expectedSeniority
      const actual = result.seniority_analysis
      
      if (actual.candidate === expected.candidate && actual.required === expected.required && actual.match === expected.match) {
        console.log('✅ Seniority detection matches expectations')
      } else {
        console.log('❌ Seniority detection mismatch:')
        console.log(`   Expected: ${expected.candidate} → ${expected.required} (match: ${expected.match})`)
        console.log(`   Actual: ${actual.candidate} → ${actual.required} (match: ${actual.match})`)
      }
    } else {
      console.log('❌ No seniority analysis in response')
    }

    // Check overall score
    console.log(`📊 Overall Score: ${result.match_analysis?.overall_score || 'N/A'}`)
    console.log(`📊 Status: ${result.match_analysis?.status || 'N/A'}`)

    return result

  } catch (error) {
    console.log(`❌ Error testing ${functionName}:`, error.message)
    return null
  }
}

async function runAllTests() {
  console.log('🚀 Starting Seniority Matching Tests...\n')
  console.log('Note: Make sure to set SUPABASE_ANON_KEY environment variable')

  for (const scenario of TEST_SCENARIOS) {
    // Test LinkedIn API (most comprehensive)
    await testEdgeFunction('LinkedIn API', EDGE_FUNCTIONS.LinkedIn, scenario)
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✨ All tests completed!')
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests()
}

module.exports = { testEdgeFunction, TEST_SCENARIOS, EDGE_FUNCTIONS }