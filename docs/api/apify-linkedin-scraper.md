# LinkedIn Profile Scraper API Integration Documentation

## Overview
This API endpoint scrapes LinkedIn profiles and returns comprehensive profile data including personal information, work experience, skills, education, and recommendations. It provides detailed candidate information for recruitment analysis.

## API Details

### Endpoint Information
- **URL**: `https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items`
- **Method**: `GET` 
- **Authentication**: API Token required
- **Token**: `apify_api_93zdEJsXGrvPFQdzh2as637W3Za2VE0C3Bi2`

## Request Format

### Input Schema
```json
{
  "profileUrls": ["string (LinkedIn profile URLs)"]
}
```

### Input Example
```json
{
  "profileUrls": [
    "https://www.linkedin.com/in/julioszabo/"
  ]
}
```

## Response Format

### Success Response (200)
Returns an array of profile objects:

```json
[
  {
    "linkedinUrl": "string",
    "firstName": "string",
    "lastName": "string", 
    "fullName": "string",
    "headline": "string",
    "connections": "number",
    "followers": "number",
    "email": "string | null",
    "mobileNumber": "string | null",
    "jobTitle": "string",
    "companyName": "string",
    "companyIndustry": "string",
    "companyWebsite": "string",
    "companyLinkedin": "string",
    "companyFoundedIn": "number",
    "companySize": "string",
    "currentJobDuration": "string",
    "currentJobDurationInYrs": "number",
    "topSkillsByEndorsements": "string",
    "addressCountryOnly": "string",
    "addressWithCountry": "string",
    "addressWithoutCountry": "string",
    "profilePic": "string (URL)",
    "profilePicHighQuality": "string (URL)",
    "about": "string",
    "publicIdentifier": "string",
    "urn": "string",
    "experiences": [
      {
        "companyId": "string",
        "companyUrn": "string",
        "companyLink1": "string",
        "logo": "string (URL)",
        "title": "string",
        "subtitle": "string",
        "caption": "string",
        "metadata": "string (optional)",
        "breakdown": "boolean",
        "subComponents": [
          {
            "description": [
              {
                "type": "textComponent",
                "text": "string"
              }
            ]
          }
        ]
      }
    ],
    "skills": [
      {
        "title": "string",
        "subComponents": [
          {
            "description": [
              {
                "type": "insightComponent",
                "text": "string"
              }
            ]
          }
        ]
      }
    ],
    "educations": ["array"],
    "licenseAndCertificates": ["array"],
    "languages": ["array"],
    "projects": ["array"],
    "courses": ["array"],
    "interests": ["array"],
    "recommendations": ["array"]
  }
]
```

### Key Response Fields
- **Personal Info**: firstName, lastName, email, phone, location
- **Professional**: jobTitle, companyName, headline, experience duration
- **Experience**: Detailed work history with descriptions
- **Skills**: Skills list with endorsement counts
- **Education**: Academic background
- **Certifications**: Professional certifications and licenses
- **Social**: LinkedIn connections, followers, recommendations

## Integration Guide for Vita App

### Basic API Call
```javascript
async function scrapeLinkedInProfile(profileUrl) {
  const requestBody = {
    profileUrls: [profileUrl]
  };
  
  try {
    const response = await fetch(
      'https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=apify_api_93zdEJsXGrvPFQdzh2as637W3Za2VE0C3Bi2',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    const profiles = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to scrape LinkedIn profile');
    }
    
    return profiles[0]; // Return first profile
  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component
async function handleLinkedInUrlAnalysis(linkedinUrl) {
  setLoading(true);
  
  try {
    // Scrape the LinkedIn profile
    const profileData = await scrapeLinkedInProfile(linkedinUrl);
    
    // Adapt the profile structure if needed
    const adaptedProfile = await adaptLinkedInProfile(profileData);
    
    // Process the profile data
    setCandidateProfile(adaptedProfile);
    
    // Save to database
    await saveCandidateToJob(adaptedProfile, currentJobId);
    
  } catch (error) {
    setError(`Failed to analyze LinkedIn profile: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Integration with Adapter API
```javascript
// Complete workflow: Scrape → Adapt → Save
async function processLinkedInProfile(linkedinUrl) {
  try {
    // Step 1: Scrape profile data
    const rawProfile = await scrapeLinkedInProfile(linkedinUrl);
    
    // Step 2: Adapt structure using your adapter API
    const adaptedProfile = await adaptLinkedInProfile(rawProfile);
    
    // Step 3: Save to Supabase
    const savedCandidate = await saveCandidateProfile(adaptedProfile);
    
    return savedCandidate;
  } catch (error) {
    throw new Error(`Profile processing failed: ${error.message}`);
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Invalid LinkedIn URL**: Profile URL format issues
2. **Private Profile**: Profile not publicly accessible
3. **Rate Limiting**: Too many requests to Apify API
4. **Network Issues**: Connection failures or timeouts
5. **Invalid Token**: Authentication failures

### Recommended Error Handling
```javascript
function getErrorMessage(error) {
  if (error.includes('token')) {
    return 'Authentication failed. Please check API configuration.';
  }
  if (error.includes('rate limit')) {
    return 'Too many requests. Please try again later.';
  }
  if (error.includes('private')) {
    return 'This LinkedIn profile is private and cannot be accessed.';
  }
  return 'Failed to scrape LinkedIn profile. Please verify the URL and try again.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Profile Analysis**: Scrape LinkedIn profiles for candidate evaluation
2. **Data Enrichment**: Enhance candidate profiles with comprehensive LinkedIn data
3. **Bulk Processing**: Process multiple LinkedIn URLs
4. **Profile Verification**: Verify candidate information against LinkedIn data

### User Experience Flow
1. User provides LinkedIn profile URL
2. App calls scraper API to fetch profile data
3. Display loading state during scraping process
4. Optionally adapt profile structure using adapter API
5. Show comprehensive candidate profile with all LinkedIn data
6. Allow user to save candidate with enriched information

### Data Processing
- Extract comprehensive profile information
- Process work experience with detailed descriptions
- Analyze skills with endorsement counts
- Store education and certification data
- Preserve recommendations and social proof

## Performance Considerations
- API processes profiles synchronously
- Response time depends on profile complexity
- Consider implementing caching for frequently accessed profiles
- Rate limiting may apply - implement retry logic
- Large profiles may have extensive data - handle accordingly