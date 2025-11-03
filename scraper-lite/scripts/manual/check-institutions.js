#!/usr/bin/env node
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
const { institutions } = require(path.join(__dirname, '../../../legacy/institutionConfig.ts'));

console.log('\n📊 INSTITUTION ANALYSIS\n');
console.log('='.repeat(70));

const total = institutions.length;
const withAutoDiscovery = institutions.filter(i => i.autoDiscovery).length;
const withoutAutoDiscovery = total - withAutoDiscovery;

console.log(`Total institutions: ${total}`);
console.log(`✅ Auto-discovery enabled: ${withAutoDiscovery}`);
console.log(`❌ Auto-discovery disabled: ${withoutAutoDiscovery}`);

console.log('\n📋 Funding Types Coverage:\n');

const fundingTypes = {};
institutions.forEach(inst => {
  inst.fundingTypes?.forEach(ft => {
    if (!fundingTypes[ft]) {
      fundingTypes[ft] = { total: 0, autoDiscovery: 0 };
    }
    fundingTypes[ft].total++;
    if (inst.autoDiscovery) {
      fundingTypes[ft].autoDiscovery++;
    }
  });
});

Object.keys(fundingTypes).sort().forEach(ft => {
  const { total, autoDiscovery } = fundingTypes[ft];
  console.log(`  ${ft.padEnd(20)} ${String(total).padStart(3)} total, ${String(autoDiscovery).padStart(3)} with auto-discovery`);
});

console.log('\n📈 Institutions with Auto-Discovery:\n');

institutions
  .filter(i => i.autoDiscovery)
  .forEach(inst => {
    console.log(`  ✅ ${inst.name.padEnd(40)} ${inst.fundingTypes.join(', ')}`);
  });

console.log('\n📉 Institutions WITHOUT Auto-Discovery (need to enable):\n');

institutions
  .filter(i => !i.autoDiscovery)
  .slice(0, 10)
  .forEach(inst => {
    console.log(`  ❌ ${inst.name.padEnd(40)} ${inst.fundingTypes.join(', ')}`);
  });

if (institutions.filter(i => !i.autoDiscovery).length > 10) {
  console.log(`  ... and ${institutions.filter(i => !i.autoDiscovery).length - 10} more`);
}

console.log('\n' + '='.repeat(70));
console.log('\n💡 To use all institutions:');
console.log('   Set LITE_ALL_INSTITUTIONS=1 when running auto-cycle');
console.log('\n💡 To enable more institutions:');
console.log('   Set autoDiscovery: true in legacy/institutionConfig.ts\n');

