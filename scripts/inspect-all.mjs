import fs from 'fs';

const content = fs.readFileSync('src/app/page.js', 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING TABS AND KEYWORD OCCURRENCES ===');
lines.forEach((l, i) => {
  if (
    l.includes("activeTab === 'habits'") ||
    l.includes("activeTab === 'profile'") ||
    l.includes("activeTab === 'pantry'") ||
    l.includes("activeTab === 'analytics'") ||
    l.includes("calculateDailyAuraScore") ||
    l.includes("calculateSystemicPillars") ||
    l.includes("analyzeWeeklyWorkoutBalance")
  ) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
