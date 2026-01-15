const fs = require('fs');

const enContent = fs.readFileSync('shared/i18n/translations/en.json', 'utf8');
const deContent = fs.readFileSync('shared/i18n/translations/de.json', 'utf8');

// Split by lines and find duplicate key lines
const enLines = enContent.split('\n');
const deLines = deContent.split('\n');

// Extract key names from lines that contain keys
const enKeyLines = enLines.filter(line => line.trim().startsWith('"') && line.includes('":'));
const deKeyLines = deLines.filter(line => line.trim().startsWith('"') && line.includes('":'));

// Get just the keys
const enKeysRaw = enKeyLines.map(line => line.split('"')[1]);
const deKeysRaw = deKeyLines.map(line => line.split('"')[1]);

console.log('EN raw keys found:', enKeysRaw.length);
console.log('DE raw keys found:', deKeysRaw.length);

// Find duplicates
const enDuplicatesRaw = enKeysRaw.filter((key, index) => enKeysRaw.indexOf(key) !== index);
const deDuplicatesRaw = deKeysRaw.filter((key, index) => deKeysRaw.indexOf(key) !== index);

console.log('EN raw duplicates:', [...new Set(enDuplicatesRaw)]);
console.log('DE raw duplicates:', [...new Set(deDuplicatesRaw)]);

// Show counts
console.log('EN duplicate count:', enDuplicatesRaw.length);
console.log('DE duplicate count:', deDuplicatesRaw.length);

// Also check for exact line duplicates
const enLineDuplicates = enLines.filter((line, index) => 
  line.trim().startsWith('"') && 
  line.includes('":') && 
  enLines.indexOf(line) !== index
);

const deLineDuplicates = deLines.filter((line, index) => 
  line.trim().startsWith('"') && 
  line.includes('":') && 
  deLines.indexOf(line) !== index
);

console.log('EN line duplicates:', enLineDuplicates.length);
console.log('DE line duplicates:', deLineDuplicates.length);

if (enLineDuplicates.length > 0) {
  console.log('EN duplicate lines:');
  enLineDuplicates.forEach(line => console.log('  ', line.trim()));
}

if (deLineDuplicates.length > 0) {
  console.log('DE duplicate lines:');
  deLineDuplicates.forEach(line => console.log('  ', line.trim()));
}

// Find exact line positions for duplicates
console.log('\n=== ENGLISH FILE DUPLICATE POSITIONS ===');
const seenEnLines = new Map();
const enPositions = [];

enLines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('"') && trimmed.includes('":')) {
    if (seenEnLines.has(trimmed)) {
      enPositions.push({
        line: trimmed,
        firstLine: seenEnLines.get(trimmed) + 1,
        duplicateLine: index + 1
      });
    } else {
      seenEnLines.set(trimmed, index);
    }
  }
});

enPositions.forEach(pos => {
  console.log(`Remove line ${pos.duplicateLine}: ${pos.line.substring(0, 50)}...`);
  console.log(`  (keep line ${pos.firstLine})`);
});

console.log('\n=== GERMAN FILE DUPLICATE POSITIONS ===');
const seenDeLines = new Map();
const dePositions = [];

deLines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('"') && trimmed.includes('":')) {
    if (seenDeLines.has(trimmed)) {
      dePositions.push({
        line: trimmed,
        firstLine: seenDeLines.get(trimmed) + 1,
        duplicateLine: index + 1
      });
    } else {
      seenDeLines.set(trimmed, index);
    }
  }
});

dePositions.forEach(pos => {
  console.log(`Remove line ${pos.duplicateLine}: ${pos.line.substring(0, 50)}...`);
  console.log(`  (keep line ${pos.firstLine})`);
});

// Final verification
console.log('\n=== FINAL VERIFICATION ===');
const finalEn = JSON.parse(fs.readFileSync('shared/i18n/translations/en.json', 'utf8'));
const finalDe = JSON.parse(fs.readFileSync('shared/i18n/translations/de.json', 'utf8'));

console.log(`Final EN keys: ${Object.keys(finalEn).length}`);
console.log(`Final DE keys: ${Object.keys(finalDe).length}`);

// Check for any remaining duplicates
const finalEnKeys = Object.keys(finalEn);
const finalDeKeys = Object.keys(finalDe);

const finalEnDuplicates = finalEnKeys.filter((key, index) => finalEnKeys.indexOf(key) !== index);
const finalDeDuplicates = finalDeKeys.filter((key, index) => finalDeKeys.indexOf(key) !== index);

console.log(`Final EN duplicates: ${finalEnDuplicates.length}`);
console.log(`Final DE duplicates: ${finalDeDuplicates.length}`);

if (finalEnDuplicates.length > 0) {
  console.log('Remaining EN duplicates:', finalEnDuplicates);
}
if (finalDeDuplicates.length > 0) {
  console.log('Remaining DE duplicates:', finalDeDuplicates);
}

console.log('\n✅ Cleanup verification complete!');