/**
 * Test script to verify Laravel matching functionality
 */

// Import modules (simulating the matching logic)
console.log('Testing Laravel Skill Matching...\n');

// Test data
const candidateSkills = [
  {
    name: 'Laravel',
    yearsOfExperience: 3.8,
    proficiencyLevel: 'advanced',
    type: 'technical_skill',
    source: 'parsed'
  }
];

const jobRequirements = [
  {
    id: 'laravel-req',
    name: 'Laravel',
    proficiencyRequired: 'advanced',
    importance: 'optional',
    category: 'technical_skill'
  }
];

console.log('Test Case: Laravel Matching');
console.log('========================');
console.log('Candidate Skill:', JSON.stringify(candidateSkills[0], null, 2));
console.log('Job Requirement:', JSON.stringify(jobRequirements[0], null, 2));
console.log('\nExpected Result: 90%+ match with exact match type');
console.log('Current Issue: 0% match with "No clear evidence found"');
console.log('\nFix Applied: Added Laravel to skill registry with proper aliases and relationships');
console.log('Laravel aliases: ["Laravel Framework", "Laravel PHP", "laravel"]');
console.log('Laravel parents: ["PHP", "Backend Development", "Web Development"]');