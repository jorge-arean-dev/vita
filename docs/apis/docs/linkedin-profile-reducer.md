# LinkedIn Profile Reducer API Integration Documentation

## Overview
This API endpoint adapts and standardizes LinkedIn profile data structures for consistent processing in the Vita app. It transforms complex LinkedIn profile formats into a simplified, uniform structure and extracts experience descriptions from nested components.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/linkedin-profile-reducer`
- **Platform**: Supabase Edge Function
- **Method**: `POST`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins

### Authentication
- Supabase Auth required

## Request Format

### Input Schema
The API accepts either a single LinkedIn profile object or an array of profiles:

**Single Profile:**
```json
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string (optional)",
  "mobileNumber": "string (optional)",
  "linkedinUrl": "string (optional)",
  "publicIdentifier": "string (optional)",
  "about": "string (optional)",
  "addressWithCountry": "string (optional)",
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string",
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
  "courses": ["array (optional)"],
  "licenseAndCertificates": ["array (optional)"],
  "recommendations": ["array (optional)"]
}
```

**Array of Profiles:**
```json
[
  {
    // Profile object as above
  }
]
```

### Input Example
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@email.com",
  "linkedinUrl": "https://linkedin.com/in/johnsmith",
  "addressWithCountry": "United States",
  "experiences": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "subComponents": [
        {
          "description": [
            {
              "type": "textComponent", 
              "text": "Led development of React applications and mentored junior developers."
            }
          ]
        }
      ]
    }
  ],
  "courses": [],
  "licenseAndCertificates": [],
  "recommendations": []
}
```

### Input Validation Requirements
- Must contain at least `firstName` OR `lastName`
- Must contain non-empty `experiences` array
- If array input provided, must not be empty
- Profile data must be a valid object

## Response Format

### Success Response (200)
```json
{
  "firstName": "string | null",
  "lastName": "string | null",
  "email": "string | null", 
  "mobileNumber": "string | null",
  "linkedinUrl": "string | null",
  "publicIdentifier": "string | null",
  "about": "string | null",
  "addressCountryOnly": "string | null",
  "experiences": [
    {
      "title": "string",
      "company": "string", 
      "startDate": "string",
      "endDate": "string",
      "description": "string (extracted from subComponents)"
    }
  ],
  "courses": ["array"],
  "licenseAndCertificates": ["array"],
  "recommendations": ["array"]
}
```

### Success Response Example
```json
{
  "firstName": "John",
  "lastName": "Smith", 
  "email": "john.smith@email.com",
  "mobileNumber": null,
  "linkedinUrl": "https://linkedin.com/in/johnsmith",
  "publicIdentifier": "johnsmith",
  "about": "Experienced software engineer with 8+ years in web development",
  "addressCountryOnly": "United States",
  "experiences": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "startDate": "2020-01", 
      "endDate": "2023-12",
      "description": "Led development of React applications and mentored junior developers."
    }
  ],
  "courses": [],
  "licenseAndCertificates": [],
  "recommendations": []
}
```

### Error Response (400/405/500)
```json
{
  "error": "string (error description)"
}
```

### Error Response Examples
```json
{
  "error": "Method not allowed"
}
```

```json
{
  "error": "Empty array provided. Expected LinkedIn profile data."
}
```

```json
{
  "error": "Profile must contain at least firstName or lastName."
}
```

```json
{
  "error": "Profile must contain non-empty experiences array."
}
```

```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

## Data Transformation Details

### Key Transformations
1. **Description Extraction**: Extracts text from nested `subComponents` structure in experiences
2. **Address Mapping**: Maps `addressWithCountry` to `addressCountryOnly`
3. **Array Handling**: Accepts both single objects and arrays (uses first element if array)
4. **Field Standardization**: Ensures consistent null values for missing fields
5. **Structure Cleanup**: Removes complex nested structures after extraction

### Field Mappings
- `addressWithCountry` → `addressCountryOnly`
- `experiences[].subComponents` → `experiences[].description` (extracted text)
- All other fields preserved as-is
- Additional fields from input are copied to output

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client
async function adaptLinkedInProfile(profileData) {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-profile-adapter', {
      body: profileData
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error adapting LinkedIn profile:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch to Supabase Edge Function
async function adaptLinkedInProfile(profileData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/linkedin-profile-adapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to adapt profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error adapting LinkedIn profile:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component
async function handleLinkedInProfileProcessing(rawProfileData) {
  setLoading(true);
  
  try {
    // Adapt the profile structure
    const adaptedProfile = await adaptLinkedInProfile(rawProfileData);
    
    // Process the standardized profile data
    setProfileData(adaptedProfile);
    
    // Save to Supabase if needed
    await saveCandidateProfile(adaptedProfile, currentJobId);
    
  } catch (error) {
    setError(`Failed to process LinkedIn profile: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Supabase Database Integration
```javascript
// Save adapted profile data to Supabase
async function saveCandidateProfile(adaptedProfile, jobId) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      job_id: jobId,
      first_name: adaptedProfile.firstName,
      last_name: adaptedProfile.lastName,
      email: adaptedProfile.email,
      phone: adaptedProfile.mobileNumber,
      linkedin_url: adaptedProfile.linkedinUrl,
      public_identifier: adaptedProfile.publicIdentifier,
      about: adaptedProfile.about,
      country: adaptedProfile.addressCountryOnly,
      experiences: adaptedProfile.experiences,
      courses: adaptedProfile.courses,
      certifications: adaptedProfile.licenseAndCertificates,
      recommendations: adaptedProfile.recommendations,
      created_at: new Date().toISOString()
    });
    
  if (error) throw error;
  return data;
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Empty Array**: Array input with no elements
3. **Invalid Format**: Non-object input or malformed data
4. **Missing Required Fields**: No firstName/lastName provided
5. **Missing Experiences**: Empty or missing experiences array
6. **Processing Errors**: Internal server errors during adaptation

### Recommended Error Handling
```javascript
function getErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Empty array')) {
    return 'No profile data provided. Please include LinkedIn profile information.';
  }
  if (error.includes('firstName or lastName')) {
    return 'Profile must include at least a first name or last name.';
  }
  if (error.includes('experiences array')) {
    return 'Profile must include work experience information.';
  }
  return 'Failed to process LinkedIn profile. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Profile Standardization**: Convert raw LinkedIn data to consistent format
2. **Data Processing Pipeline**: Pre-process profiles before analysis or storage
3. **Experience Extraction**: Clean extraction of job descriptions from complex structures
4. **Multi-source Support**: Handle profiles from different LinkedIn scraping sources

### User Experience Flow
1. User provides LinkedIn profile data (URL, scrape, or manual input)
2. App calls linkedin-profile-adapter API to standardize format
3. Display loading state during processing
4. Use adapted profile for further analysis or storage
5. Maintain original data integrity while providing clean structure

### Data Persistence
- Store adapted profile in standardized format
- Preserve all original fields plus extracted descriptions
- Link candidate to current job via `job_id`
- Enable consistent querying and analysis across profiles

## Performance Considerations
- Lightweight processing focused on data transformation
- Fast response times for profile adaptation
- Handles both single profiles and batch processing (first element of array)
- Memory efficient with direct field mapping and extraction
- No external API calls - pure data transformation