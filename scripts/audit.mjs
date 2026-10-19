import fs from 'fs';

const content = fs.readFileSync('src/app/page.js', 'utf8');
const lines = content.split('\n');

console.log('=== AUDITING src/app/page.js for STATIC DATA ===');

const suspiciousPatterns = [
  { name: 'Hardcoded days array', regex: /\[\s*10\s*,\s*11/ },
  { name: 'Hardcoded streak', regex: /streakDays.*213/ },
  { name: 'Hardcoded selectedDay', regex: /selectedDay.*12/ },
  { name: 'aurafit_weights mismatch', regex: /aurafit_weights/ },
  { name: 'Hardcoded Oct dates', regex: /'10 Oct'|'11 Oct'|'12 Oct'/ },
  { name: 'Hardcoded water', regex: /waterMl.*=\s*useState\([1-9]/ },
  { name: 'Static workout routines', regex: /recentHeavyDays.*=\s*useState\([1-9]/ }
];

suspiciousPatterns.forEach(({ name, regex }) => {
  lines.forEach((line, idx) => {
    if (regex.test(line)) {
      console.log(`[FOUND: ${name}] Line ${idx + 1}: ${line.trim()}`);
    }
  });
});

console.log('Audit check complete.');
