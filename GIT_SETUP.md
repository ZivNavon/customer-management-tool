# Git Setup Instructions

Since Git commands are not available in the current environment, please follow these steps to set up your GitHub repository:

## 1. Install Git (if not already installed)

### Windows
- Download from https://git-scm.com/download/win
- Or use Chocolatey: `choco install git`
- Or use Winget: `winget install Git.Git`

### Verify Installation
```bash
git --version
```

## 2. Initialize Repository

Navigate to your project directory and run:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "feat: initial project setup with comprehensive customer management system"

# Create main branch (if not already created)
git branch -M main
```

## 3. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (public or private)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

## 4. Connect to GitHub

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

## 5. Set Up Development Workflow

### Create Development Branch
```bash
git checkout -b develop
git push -u origin develop
```

### Set Up Branch Protection (Optional)
In GitHub repository settings:
1. Go to Settings > Branches
2. Add rule for `main` branch
3. Enable "Require pull request reviews before merging"
4. Enable "Require status checks to pass before merging"

## 6. Future Development Workflow

For each new feature:

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make your changes
# ... development work ...

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Merge to develop when approved
# Periodically merge develop to main for releases
```

## 7. GitHub Actions Setup

The CI/CD workflows are already configured in `.github/workflows/`. They will automatically run when you:
- Push to main or develop branches
- Create pull requests
- Create release tags

### Required Secrets (for Docker deployment)
If you plan to use Docker Hub deployment:
1. Go to GitHub repository Settings > Secrets and variables > Actions
2. Add secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password/token

## 8. First Deployment Test

After setting up the repository:

```bash
# Test the development server
npm run dev

# Test the build process
npm run build

# Test linting
npm run lint

# Test type checking
npm run type-check
```

## 9. Team Collaboration

### For Team Members
```bash
# Clone the repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/my-feature

# ... make changes ...

# Push and create PR
git push origin feature/my-feature
```

### Code Review Process
1. All changes go through Pull Requests
2. Require at least one approval
3. Run automated tests before merging
4. Delete feature branches after merging

## 10. Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Update version in package.json
# Update CHANGELOG.md
# Test thoroughly

# Merge to main
git checkout main
git merge release/v1.0.0

# Create tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Troubleshooting

### Common Issues
1. **Git not recognized**: Install Git and restart terminal
2. **Authentication failed**: Set up SSH keys or use personal access tokens
3. **Merge conflicts**: Resolve conflicts manually and commit

### Useful Commands
```bash
# Check repository status
git status

# View commit history
git log --oneline

# Switch branches
git checkout branch-name

# Update from remote
git pull origin branch-name

# View remotes
git remote -v
```

Once you have Git installed and the repository set up, all future development will follow the proper workflow with version control, pull requests, and automated testing!
