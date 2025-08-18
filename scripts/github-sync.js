#!/usr/bin/env node

const { execSync } = require('child_process');

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return 'main';
  }
}

function main() {
  const action = process.argv[2] || 'sync';
  const customMessage = process.argv[3];
  const currentBranch = getCurrentBranch();
  
  switch (action) {
    case 'pull':
      console.log('📥 Pulling latest changes from GitHub...');
      runCommand(`git pull origin ${currentBranch}`, 'Pulling from remote');
      console.log('✅ Your local repository is now up to date!');
      break;
      
    case 'sync':
    case 'push':
      console.log('📤 Syncing changes to GitHub...');
      
      // Check if there are changes to commit
      try {
        execSync('git diff --exit-code', { stdio: 'pipe' });
        execSync('git diff --cached --exit-code', { stdio: 'pipe' });
        console.log('ℹ️  No changes to commit');
      } catch (error) {
        // There are changes, let's commit them
        const message = customMessage || `🔧 Work in progress - ${new Date().toLocaleDateString()}`;
        runCommand('git add .', 'Staging changes');
        runCommand(`git commit -m "${message}"`, 'Committing changes');
      }
      
      runCommand(`git push origin ${currentBranch}`, 'Pushing to GitHub');
      console.log('✅ Changes synced to GitHub successfully!');
      break;
      
    case 'status':
      console.log('📊 Current Git status:');
      runCommand('git status', 'Checking status');
      break;
      
    default:
      console.log(`
🔧 GitHub Sync Tool Usage:

npm run pull          - Pull latest changes from GitHub
npm run sync          - Push current changes to GitHub  
npm run status        - Show current Git status

Release Commands:
npm run release:patch - Bug fixes (0.1.0 → 0.1.1)
npm run release:minor - New features (0.1.0 → 0.2.0)
npm run release:major - Breaking changes (0.1.0 → 1.0.0)

Examples:
npm run sync "Added new customer modal"
npm run release:minor "Added AI summary feature"
      `);
  }
}

main();
