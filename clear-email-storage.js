// Temporary script to clear phantom emails from sessionStorage
// Run this in browser console on the email-builder page

const jobId = '1716c310-be6f-43e2-b6c5-ccffafdc78f2';
const storageKey = `email-builder-unsaved-${jobId}`;

console.log('Current sessionStorage for this job:');
const stored = sessionStorage.getItem(storageKey);
if (stored) {
  console.log(JSON.parse(stored));
  console.log('Clearing sessionStorage...');
  sessionStorage.removeItem(storageKey);
  console.log('Cleared! Please refresh the page.');
} else {
  console.log('No sessionStorage found for this job.');
}

// Also clear expanded states
const expandedKey = `email-builder-expanded-${jobId}`;
const expandedStored = sessionStorage.getItem(expandedKey);
if (expandedStored) {
  console.log('Clearing expanded states...');
  sessionStorage.removeItem(expandedKey);
}

console.log('All email builder storage cleared for job', jobId);