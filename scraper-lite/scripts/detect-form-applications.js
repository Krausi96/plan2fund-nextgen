#!/usr/bin/env node
/**
 * Detect Form-Based Applications
 * Identifies programs that require account creation or form-based application
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const rawHtmlDir = path.join(__dirname, '..', 'data', 'lite', 'raw');

function detectFormApplications() {
  console.log('\n🔍 Detecting Form-Based Applications\n');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ State file not found');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  console.log(`\n📊 Analyzing ${pages.length} pages...\n`);
  
  const formApplications = [];
  const loginRequired = [];
  const formFields = [];
  
  // Login/account indicators
  const loginPatterns = [
    /(?:login|anmelden|registrieren|register|account|benutzerkonto|user account)/i,
    /(?:bewerbung|application)[\s]+(?:über|via|through)[\s]+(?:portal|system|plattform|platform)/i,
    /(?:online|digital)[\s]+(?:bewerbung|application)[\s]+(?:erforderlich|required|necessary)/i,
    /(?:erst|first)[\s]+(?:registrieren|register|anmelden|login)/i
  ];
  
  // Form field patterns
  const formFieldPatterns = [
    /input[type="text"]|input[type="email"]|select|textarea/i,
    /(?:formular|form)[\s]+(?:ausfüllen|fill|complete)/i,
    /(?:feld|field)[\s]+(?:ausfüllen|fill|required)/i
  ];
  
  pages.forEach(page => {
    const url = page.url || '';
    const title = page.title || '';
    const description = page.description || '';
    const text = (title + ' ' + description).toLowerCase();
    
    // Check for login requirements
    const hasLoginIndicator = loginPatterns.some(pattern => pattern.test(text));
    
    // Try to load raw HTML if available
    let hasFormFields = false;
    let detectedFields = [];
    
    if (page.raw_html_path && fs.existsSync(page.raw_html_path)) {
      try {
        const html = fs.readFileSync(page.raw_html_path, 'utf8');
        const $ = cheerio.load(html);
        
        // Detect form elements
        const inputs = $('input[type="text"], input[type="email"], select, textarea');
        if (inputs.length > 0) {
          hasFormFields = true;
          
          inputs.slice(0, 10).each((_, el) => {
            const $el = $(el);
            const name = $el.attr('name') || '';
            const type = $el.attr('type') || $el.prop('tagName').toLowerCase();
            const label = $el.prev('label').text() || 
                         $el.closest('label').text() ||
                         $el.attr('placeholder') || '';
            const required = $el.attr('required') !== undefined;
            
            if (name || label) {
              detectedFields.push({
                name: name.substring(0, 50),
                type,
                label: label.substring(0, 100),
                required
              });
            }
          });
        }
      } catch (e) {
        // Ignore HTML read errors
      }
    }
    
    if (hasLoginIndicator || hasFormFields) {
      const app = {
        url,
        title: title.substring(0, 60),
        hasLogin: hasLoginIndicator,
        hasFormFields,
        fields: detectedFields.slice(0, 5),
        formCount: detectedFields.length
      };
      
      if (hasLoginIndicator) loginRequired.push(app);
      if (hasFormFields) formFields.push(app);
      formApplications.push(app);
    }
  });
  
  // Report findings
  console.log('📋 Form-Based Applications Found:');
  console.log(`   Total: ${formApplications.length} pages`);
  console.log(`   Require login: ${loginRequired.length} pages`);
  console.log(`   Have form fields: ${formFields.length} pages`);
  
  if (formApplications.length > 0) {
    console.log('\n🔍 Sample Form-Based Applications:');
    formApplications.slice(0, 10).forEach((app, i) => {
      console.log(`\n${i + 1}. ${app.title}`);
      console.log(`   URL: ${app.url.substring(0, 60)}...`);
      if (app.hasLogin) console.log(`   🔐 Requires login/account`);
      if (app.hasFormFields) {
        console.log(`   📝 Has ${app.formCount} form fields`);
        if (app.fields.length > 0) {
          console.log(`   Fields:`);
          app.fields.forEach(field => {
            console.log(`     - ${field.label || field.name} (${field.type}${field.required ? ', required' : ''})`);
          });
        }
      }
    });
  } else {
    console.log('\n⚠️  No form-based applications detected');
    console.log('   This might mean:');
    console.log('   1. HTML forms not saved in raw HTML');
    console.log('   2. Forms loaded dynamically (JavaScript)');
    console.log('   3. Detection patterns need improvement');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('   1. Save HTML forms in raw HTML storage');
  console.log('   2. Detect JavaScript-loaded forms (requires browser)');
  console.log('   3. Extract form field requirements from visible text');
  console.log('   4. Mark programs as "requires_account" or "application_form"');
  console.log('   5. Store form field metadata');
  
  console.log('\n✅ Analysis complete!\n');
}

detectFormApplications();

