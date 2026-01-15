const fs = require('fs');

function removeDuplicateLines(filePath, duplicateLineNumbers) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Sort line numbers in descending order to remove from bottom first
  const sortedLines = [...duplicateLineNumbers].sort((a, b) => b - a);
  
  console.log(`Removing ${sortedLines.length} duplicate lines from ${filePath}:`);
  sortedLines.forEach(lineNum => {
    console.log(`  Removing line ${lineNum}: ${lines[lineNum - 1].substring(0, 50)}...`);
    lines.splice(lineNum - 1, 1); // Remove the line (convert to 0-based index)
  });
  
  // Write back to file
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log(`✅ Successfully removed duplicates from ${filePath}\n`);
}

// English file duplicates (line numbers to remove)
const enDuplicateLines = [1542, 1543, 1545, 1546, 1547, 1548, 1549, 1550, 1551, 1554, 1556, 1557];

// German file duplicates (line numbers to remove)  
const deDuplicateLines = [1575, 1576, 1577, 1578, 1579, 1580, 1581, 1582, 1583, 1584, 1585, 1586, 1587, 1588, 1589, 1590, 1591, 1592];

// Remove duplicates
removeDuplicateLines('shared/i18n/translations/en.json', enDuplicateLines);
removeDuplicateLines('shared/i18n/translations/de.json', deDuplicateLines);

console.log('✨ All duplicate keys removed successfully!');