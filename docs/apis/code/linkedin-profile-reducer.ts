import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
// Function to extract description text from the complex structure
function extractDescription(subComponents) {
  if (!subComponents || !Array.isArray(subComponents)) {
    return '';
  }
  for (const component of subComponents){
    if (component.description && Array.isArray(component.description)) {
      for (const desc of component.description){
        if (desc.type === 'textComponent' && desc.text) {
          return desc.text;
        }
      }
    }
  }
  return '';
}
// Function to adapt the LinkedIn profile structure
function adaptLinkedInProfile(inputProfile) {
  console.log('Starting profile adaptation');
  // Create the adapted profile object
  const adaptedProfile = {
    // Direct field mappings
    firstName: inputProfile.firstName || null,
    lastName: inputProfile.lastName || null,
    email: inputProfile.email || null,
    mobileNumber: inputProfile.mobileNumber || null,
    linkedinUrl: inputProfile.linkedinUrl || null,
    publicIdentifier: inputProfile.publicIdentifier || null,
    about: inputProfile.about || null,
    // Map addressWithCountry to addressCountryOnly
    addressCountryOnly: inputProfile.addressWithCountry || inputProfile.addressCountryOnly || null,
    // Initialize arrays
    experiences: [],
    courses: [],
    licenseAndCertificates: [],
    recommendations: []
  };
  // Process experiences array
  if (inputProfile.experiences && Array.isArray(inputProfile.experiences)) {
    adaptedProfile.experiences = inputProfile.experiences.map((exp)=>{
      const adaptedExp = {
        // Copy all original fields
        ...exp,
        // Extract description from subComponents structure
        description: extractDescription(exp.subComponents)
      };
      // Remove subComponents since we've extracted the description
      delete adaptedExp.subComponents;
      return adaptedExp;
    });
  }
  // Process courses array (direct copy if exists)
  if (inputProfile.courses && Array.isArray(inputProfile.courses)) {
    adaptedProfile.courses = [
      ...inputProfile.courses
    ];
  }
  // Process licenseAndCertificates array (direct copy if exists)
  if (inputProfile.licenseAndCertificates && Array.isArray(inputProfile.licenseAndCertificates)) {
    adaptedProfile.licenseAndCertificates = [
      ...inputProfile.licenseAndCertificates
    ];
  }
  // Process recommendations array (direct copy if exists)
  if (inputProfile.recommendations && Array.isArray(inputProfile.recommendations)) {
    adaptedProfile.recommendations = [
      ...inputProfile.recommendations
    ];
  }
  // Copy any additional fields that might exist
  Object.keys(inputProfile).forEach((key)=>{
    if (!adaptedProfile.hasOwnProperty(key) && key !== 'addressWithCountry' && key !== 'experiences' && key !== 'courses' && key !== 'licenseAndCertificates' && key !== 'recommendations') {
      adaptedProfile[key] = inputProfile[key];
    }
  });
  console.log('Profile adaptation completed');
  return adaptedProfile;
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
    console.log('LinkedIn Profile Adapter function started');
    // Parse request body
    const requestBody = await req.json();
    let inputProfile;
    // Check if input is an array (extract first element) or object
    if (Array.isArray(requestBody)) {
      if (requestBody.length === 0) {
        return new Response(JSON.stringify({
          error: 'Empty array provided. Expected LinkedIn profile data.'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      inputProfile = requestBody[0];
      console.log('Input detected as array, extracting first element');
    } else if (typeof requestBody === 'object' && requestBody !== null) {
      inputProfile = requestBody;
      console.log('Input detected as object');
    } else {
      return new Response(JSON.stringify({
        error: 'Invalid input format. Expected LinkedIn profile object or array.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate that we have a profile object
    if (!inputProfile || typeof inputProfile !== 'object') {
      return new Response(JSON.stringify({
        error: 'Invalid profile data. Expected object with profile information.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate required fields for the target function
    if (!inputProfile.firstName && !inputProfile.lastName) {
      return new Response(JSON.stringify({
        error: 'Profile must contain at least firstName or lastName.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!inputProfile.experiences || !Array.isArray(inputProfile.experiences) || inputProfile.experiences.length === 0) {
      return new Response(JSON.stringify({
        error: 'Profile must contain non-empty experiences array.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Adapt the profile structure
    const adaptedProfile = adaptLinkedInProfile(inputProfile);
    console.log(`Successfully adapted profile for: ${adaptedProfile.firstName} ${adaptedProfile.lastName}`);
    // Return the adapted profile
    return new Response(JSON.stringify(adaptedProfile), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error in LinkedIn Profile Adapter: ${error.message}`);
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
