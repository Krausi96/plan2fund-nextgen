// PR automation with diff summaries and auto-labeling
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { sourceRegister } = require('../src/lib/sourceRegister');

// Configuration
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'plan2fund/plan2fund-nextgen';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BRANCH_PREFIX = 'auto-update-program-data';
const LABEL_PROPOSED = 'proposed-changes';
const LABEL_DATA_UPDATE = 'data-update';
const LABEL_AUTO_GENERATED = 'auto-generated';

// PR automation class
class PRAutomation {
  constructor() {
    this.changes = [];
    this.branchName = '';
    this.prNumber = null;
  }

  // Load changes from diff results or source register
  async loadChanges(diffResultsFile) {
    try {
      if (diffResultsFile && fs.existsSync(diffResultsFile)) {
        const results = JSON.parse(fs.readFileSync(diffResultsFile, 'utf8'));
        this.changes = results;
        console.log(`📋 Loaded ${this.changes.length} changes from ${diffResultsFile}`);
      } else {
        // Fallback to source register
        console.log('📋 No diff file found, checking source register for stale data...');
        const staleSources = await sourceRegister.getStaleSources();
        this.changes = staleSources.map(source => ({
          programId: source.id,
          name: source.name,
          url: source.url,
          lastChecked: source.lastChecked,
          status: 'stale',
          reason: 'Source data is stale and needs refresh'
        }));
        console.log(`📋 Found ${this.changes.length} stale sources from source register`);
      }
    } catch (error) {
      console.error('❌ Failed to load changes:', error.message);
      throw error;
    }
  }

  // Generate branch name
  generateBranchName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const changeCount = this.changes.length;
    this.branchName = `${BRANCH_PREFIX}-${timestamp}-${changeCount}changes`;
    return this.branchName;
  }

  // Create branch
  createBranch() {
    try {
      console.log(`🌿 Creating branch: ${this.branchName}`);
      
      // Check if branch exists
      try {
        execSync(`git show-ref --verify --quiet refs/heads/${this.branchName}`, { stdio: 'pipe' });
        console.log(`⚠️  Branch ${this.branchName} already exists, switching to it`);
        execSync(`git checkout ${this.branchName}`, { stdio: 'inherit' });
      } catch (error) {
        // Branch doesn't exist, create it
        execSync(`git checkout -b ${this.branchName}`, { stdio: 'inherit' });
      }
      
      console.log(`✅ Branch ${this.branchName} ready`);
    } catch (error) {
      console.error('❌ Failed to create branch:', error.message);
      throw error;
    }
  }

  // Apply changes to files
  applyChanges() {
    console.log('📝 Applying changes to files...');
    
    for (const change of this.changes) {
      try {
        const filePath = change.program.filePath;
        const updates = change.yamlUpdates;
        
        console.log(`   Updating ${change.program.file}:`);
        Object.entries(updates).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
        
        // Read current file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update YAML front-matter
        const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (yamlMatch) {
          const yamlContent = yamlMatch[1];
          const lines = yamlContent.split('\n');
          
          // Update existing fields or add new ones
          const updatedLines = [];
          const updatedKeys = new Set();
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const colonIndex = trimmed.indexOf(':');
              if (colonIndex > 0) {
                const key = trimmed.substring(0, colonIndex).trim();
                if (updates.hasOwnProperty(key)) {
                  // Update existing field
                  const value = updates[key];
                  const formattedValue = Array.isArray(value) 
                    ? `[${value.map(v => `"${v}"`).join(', ')}]`
                    : `"${value}"`;
                  updatedLines.push(`${key}: ${formattedValue}`);
                  updatedKeys.add(key);
                } else {
                  // Keep existing field
                  updatedLines.push(line);
                }
              } else {
                updatedLines.push(line);
              }
            } else {
              updatedLines.push(line);
            }
          }
          
          // Add new fields
          for (const [key, value] of Object.entries(updates)) {
            if (!updatedKeys.has(key)) {
              const formattedValue = Array.isArray(value) 
                ? `[${value.map(v => `"${v}"`).join(', ')}]`
                : `"${value}"`;
              updatedLines.push(`${key}: ${formattedValue}`);
            }
          }
          
          // Reconstruct file
          const newYamlContent = updatedLines.join('\n');
          content = content.replace(yamlMatch[0], `---\n${newYamlContent}\n---`);
        }
        
        // Write updated file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ Updated ${change.program.file}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to update ${change.program.file}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All changes applied successfully');
  }

  // Commit changes
  commitChanges() {
    try {
      console.log('💾 Committing changes...');
      
      // Add all modified files
      execSync('git add data/programs/*.md', { stdio: 'inherit' });
      
      // Check if there are changes to commit
      try {
        execSync('git diff --cached --quiet', { stdio: 'pipe' });
        console.log('ℹ️  No changes to commit');
        return false;
      } catch (error) {
        // There are changes to commit
      }
      
      // Create commit message
      const commitMessage = this.generateCommitMessage();
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      console.log('✅ Changes committed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to commit changes:', error.message);
      throw error;
    }
  }

  // Generate commit message
  generateCommitMessage() {
    const changeCount = this.changes.length;
    const programs = this.changes.map(c => c.program.name).join(', ');
    
    return `Update program data from source URLs (${changeCount} programs)

- Programs updated: ${programs}
- Changes: ${this.changes.map(c => c.changes.map(ch => ch.type).join(', ')).join('; ')}
- Auto-generated by source-diff-fetcher

Co-authored-by: plan2fund-bot <bot@plan2fund.ai>`;
  }

  // Push branch
  pushBranch() {
    try {
      console.log(`🚀 Pushing branch ${this.branchName}...`);
      
      execSync(`git push origin ${this.branchName}`, { stdio: 'inherit' });
      
      console.log('✅ Branch pushed successfully');
    } catch (error) {
      console.error('❌ Failed to push branch:', error.message);
      throw error;
    }
  }

  // Create pull request
  async createPullRequest() {
    if (!GITHUB_TOKEN) {
      console.log('⚠️  No GitHub token provided, skipping PR creation');
      return null;
    }
    
    try {
      console.log('📋 Creating pull request...');
      
      const prTitle = this.generatePRTitle();
      const prBody = this.generatePRBody();
      
      // Create PR using GitHub CLI or API
      const prCommand = `gh pr create --title "${prTitle}" --body "${prBody}" --head ${this.branchName} --base main --label "${LABEL_PROPOSED},${LABEL_DATA_UPDATE},${LABEL_AUTO_GENERATED}"`;
      
      const output = execSync(prCommand, { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extract PR number from output
      const prMatch = output.match(/pull request #(\d+)/);
      if (prMatch) {
        this.prNumber = parseInt(prMatch[1]);
        console.log(`✅ Pull request created: #${this.prNumber}`);
      } else {
        console.log('✅ Pull request created');
      }
      
      return this.prNumber;
      
    } catch (error) {
      console.error('❌ Failed to create pull request:', error.message);
      throw error;
    }
  }

  // Generate PR title
  generatePRTitle() {
    const changeCount = this.changes.length;
    const programCount = new Set(this.changes.map(c => c.program.id)).size;
    
    return `🤖 Update program data from source URLs (${programCount} programs, ${changeCount} changes)`;
  }

  // Generate PR body
  generatePRBody() {
    const changeCount = this.changes.length;
    const programCount = new Set(this.changes.map(c => c.program.id)).size;
    
    const programsList = this.changes.map(change => {
      const changesList = change.changes.map(ch => `- **${ch.type}**: ${ch.old} → ${ch.new}`).join('\n');
      return `### ${change.program.name}
${changesList}`;
    }).join('\n\n');
    
    return `## 🤖 Automated Program Data Update

This PR contains updates to program data based on source URL crawling.

### 📊 Summary
- **Programs updated**: ${programCount}
- **Total changes**: ${changeCount}
- **Source**: Automated source-diff-fetcher
- **Generated**: ${new Date().toISOString()}

### 📝 Changes by Program

${programsList}

### 🔍 Change Types
- **amount_min/max**: Funding amount changes
- **call_deadline**: Application deadline updates
- **eligibility_criteria**: Requirement changes
- **last_updated**: Timestamp refresh

### ⚠️ Review Required
This PR contains **proposed changes** that require human review before merging.

### 🏷️ Labels
- \`${LABEL_PROPOSED}\`: Changes need human approval
- \`${LABEL_DATA_UPDATE}\`: Program data modification
- \`${LABEL_AUTO_GENERATED}\`: Created by automation

---
*Generated by source-diff-fetcher v1.0*`;
  }

  // Add labels to PR
  async addLabelsToPR(prNumber) {
    if (!GITHUB_TOKEN || !prNumber) return;
    
    try {
      console.log(`🏷️  Adding labels to PR #${prNumber}...`);
      
      const labels = [LABEL_PROPOSED, LABEL_DATA_UPDATE, LABEL_AUTO_GENERATED];
      
      for (const label of labels) {
        try {
          execSync(`gh pr edit ${prNumber} --add-label "${label}"`, { stdio: 'pipe' });
        } catch (error) {
          console.warn(`⚠️  Failed to add label ${label}:`, error.message);
        }
      }
      
      console.log('✅ Labels added successfully');
    } catch (error) {
      console.error('❌ Failed to add labels:', error.message);
    }
  }

  // Run full automation workflow
  async runWorkflow(diffResultsFile) {
    try {
      console.log('🚀 Starting PR automation workflow...');
      
      // Load changes
      this.loadChanges(diffResultsFile);
      
      if (this.changes.length === 0) {
        console.log('ℹ️  No changes to process');
        return null;
      }
      
      // Generate branch name
      this.generateBranchName();
      
      // Create branch
      this.createBranch();
      
      // Apply changes
      this.applyChanges();
      
      // Commit changes
      const hasChanges = this.commitChanges();
      if (!hasChanges) {
        console.log('ℹ️  No changes to commit, skipping PR creation');
        return null;
      }
      
      // Push branch
      this.pushBranch();
      
      // Create PR
      const prNumber = await this.createPullRequest();
      
      // Add labels
      if (prNumber) {
        await this.addLabelsToPR(prNumber);
      }
      
      console.log('🎯 PR automation workflow completed successfully!');
      
      return {
        branchName: this.branchName,
        prNumber,
        changeCount: this.changes.length,
        programCount: new Set(this.changes.map(c => c.program.id)).size
      };
      
    } catch (error) {
      console.error('❌ PR automation workflow failed:', error.message);
      throw error;
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const diffResultsFile = args[0] || 'scripts/diff-output/diff-results-latest.json';
  
  const automation = new PRAutomation();
  
  try {
    const result = await automation.runWorkflow(diffResultsFile);
    
    if (result) {
      console.log('\n📊 Workflow Results:');
      console.log(`   Branch: ${result.branchName}`);
      console.log(`   PR: #${result.prNumber}`);
      console.log(`   Programs: ${result.programCount}`);
      console.log(`   Changes: ${result.changeCount}`);
    } else {
      console.log('\nℹ️  No changes to process');
    }
    
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PRAutomation };
