#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the version type from command line arguments
const versionType = process.argv[2] || 'patch';
const customMessage = process.argv[3];

// Valid version types
const validTypes = ['patch', 'minor', 'major'];

if (!validTypes.includes(versionType)) {
  console.error('❌ Invalid version type. Use: patch, minor, or major');
  process.exit(1);
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

function generateCommitMessage(oldVersion, newVersion, type) {
  if (customMessage) {
    return `${type}: ${customMessage} (v${newVersion})`;
  }
  
  const messages = {
    patch: `🐛 Bug fixes and minor improvements (v${newVersion})`,
    minor: `✨ New features and enhancements (v${newVersion})`,
    major: `🚀 Major release with breaking changes (v${newVersion})`
  };
  
  return messages[type] || `📦 Release v${newVersion}`;
}

function main() {
  console.log(`🚀 Starting ${versionType} release process...`);
  
  // Check if working directory is clean
  try {
    execSync('git diff --exit-code', { stdio: 'pipe' });
    execSync('git diff --cached --exit-code', { stdio: 'pipe' });
  } catch (error) {
    console.log('📝 Uncommitted changes detected. Committing current changes first...');
    runCommand('git add .', 'Staging all changes');
    runCommand('git commit -m "🔧 Pre-release cleanup and updates"', 'Committing changes');
  }
  
  // Get current version before bump
  const oldVersion = getCurrentVersion();
  
  // Run tests and build
  runCommand('npm run lint', 'Running linter');
  runCommand('npm run type-check', 'Type checking');
  runCommand('npm run build', 'Building project');
  
  // Bump version
  runCommand(`npm version ${versionType} --no-git-tag-version`, `Bumping ${versionType} version`);
  
  // Get new version after bump
  const newVersion = getCurrentVersion();
  
  // Create commit with version bump
  const commitMessage = generateCommitMessage(oldVersion, newVersion, versionType);
  runCommand('git add .', 'Staging version bump');
  runCommand(`git commit -m "${commitMessage}"`, 'Committing version bump');
  
  // Create and push tag
  runCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`, 'Creating release tag');
  runCommand('git push origin main', 'Pushing to main branch');
  runCommand('git push origin --tags', 'Pushing tags');
  
  console.log(`🎉 Successfully released version ${newVersion}!`);
  console.log(`📦 Changes are now available on GitHub`);
  console.log(`🏷️  Tag: v${newVersion}`);
  console.log(`📝 Commit: ${commitMessage}`);
}

main();
