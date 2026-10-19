import fs from 'fs';

const content = fs.readFileSync('src/app/page.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes("activeTab === 'workout'") || l.includes('hybridPrescription') || l.includes('HYBRID_ATHLETE_SYSTEM')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
