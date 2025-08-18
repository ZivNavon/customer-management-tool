# GitHub Integration Guide

This project is now fully integrated with GitHub for seamless multi-computer development workflow.

## 🚀 Quick Commands

### Daily Development Workflow
```bash
# Start working (pull latest changes)
npm run pull

# Sync your work to GitHub
npm run sync

# Sync with custom message
npm run sync "Added customer search functionality"

# Check current status
npm run git:status
```

### Release Management
```bash
# Bug fixes and patches (0.1.0 → 0.1.1)
npm run release:patch

# New features (0.1.0 → 0.2.0)  
npm run release:minor

# Major changes/breaking changes (0.1.0 → 1.0.0)
npm run release:major
```

## 📋 Workflow for Multiple Computers

### Computer A (Start of Day)
1. `npm run pull` - Get latest changes
2. Make your changes
3. `npm run sync` - Push changes to GitHub

### Computer B (Later/Different Location)
1. `npm run pull` - Get the changes from Computer A
2. Continue working
3. `npm run sync` - Push your new changes

### Computer A (Next Day)
1. `npm run pull` - Get changes from Computer B
2. Continue the cycle...

## 🏷️ Version Management

The automated version system will:
- ✅ Run linting and type checking
- ✅ Build the project to ensure it works
- ✅ Bump the version number
- ✅ Create meaningful commit messages
- ✅ Tag the release
- ✅ Push everything to GitHub

### Version Types
- **Patch** (0.1.0 → 0.1.1): Bug fixes, small improvements
- **Minor** (0.1.0 → 0.2.0): New features, backwards compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes, major updates

### Custom Release Messages
```bash
# Add custom message to release
node scripts/version-manager.js minor "Added AI customer insights"
```

## 🔧 Behind the Scenes

### What `npm run sync` does:
1. Stages all changes (`git add .`)
2. Commits with timestamp (`git commit`)
3. Pushes to GitHub (`git push`)

### What `npm run release:*` does:
1. Runs linter and type checker
2. Builds the project
3. Bumps version in package.json
4. Creates commit with emoji and description
5. Creates Git tag
6. Pushes code and tags to GitHub

## 📁 Project Structure
```
scripts/
├── version-manager.js    # Handles releases and versioning
├── github-sync.js       # Handles daily sync operations
```

## 🎯 Best Practices

1. **Start each session with**: `npm run pull`
2. **End each session with**: `npm run sync`
3. **Create releases when**: You've completed a feature or fixed bugs
4. **Use descriptive messages**: `npm run sync "Fixed customer modal validation"`

## 🚨 Troubleshooting

### If sync fails:
```bash
# Check what's wrong
npm run git:status

# Manual resolution
git status
git add .
git commit -m "Fix: Manual sync"
git push origin main
```

### If you have conflicts:
```bash
# Pull and resolve manually
git pull origin main
# Resolve conflicts in VS Code
git add .
git commit -m "Resolved merge conflicts"
git push origin main
```

## 🌟 Benefits

- ✅ **Seamless multi-computer workflow**
- ✅ **Automatic version management** 
- ✅ **Meaningful commit history**
- ✅ **Consistent release process**
- ✅ **Easy collaboration**
- ✅ **No more manual Git commands**

---

**Repository**: https://github.com/ZivNavon/customer-management-tool
**Current Version**: 0.1.0
