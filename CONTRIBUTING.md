# Contributing to Customer Management System

Thank you for considering contributing to our Customer Management System! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Check if the issue already exists before creating a new one
- Provide detailed information including steps to reproduce
- Include environment details (OS, Node.js version, etc.)

### Feature Requests
- Open an issue with the "enhancement" label
- Describe the feature and its benefits
- Provide use cases and examples if possible

### Pull Requests
1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### Local Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/customers.git
cd customers

# Add upstream remote
git remote add upstream https://github.com/originalowner/customers.git

# Install dependencies
npm install
cd backend && pip install -r requirements.txt
```

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation updates
- `refactor/component-name` - Code refactoring

## 📝 Coding Standards

### TypeScript/React
- Use TypeScript for all new code
- Follow the existing code style
- Use functional components with hooks
- Write meaningful component and variable names
- Add JSDoc comments for complex functions

### Python/FastAPI
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Write docstrings for all public functions
- Use descriptive variable names

### Commit Messages
Follow conventional commits format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(dashboard): add customer risk assessment
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Frontend Testing
```bash
npm run test
npm run type-check
npm run lint
```

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Manual Testing
- Test all new features manually
- Verify responsive design
- Test both light and dark modes
- Check English and Hebrew languages
- Validate form submissions

## 📚 Code Review Guidelines

### For Contributors
- Keep PRs focused and small
- Write clear PR descriptions
- Add screenshots for UI changes
- Update documentation
- Respond to feedback promptly

### For Reviewers
- Be constructive and helpful
- Focus on code quality and maintainability
- Check for security issues
- Verify functionality works as expected
- Approve when ready

## 🎯 Areas for Contribution

### Frontend
- React components
- UI/UX improvements
- Accessibility enhancements
- Performance optimizations
- Mobile responsiveness

### Backend
- API endpoints
- Database optimizations
- Authentication improvements
- Testing coverage
- Documentation

### DevOps
- CI/CD improvements
- Docker optimizations
- Deployment scripts
- Monitoring setup

### Documentation
- Code documentation
- User guides
- API documentation
- Setup instructions

## 🚀 Release Process

### Version Numbering
We follow semantic versioning (SemVer):
- MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Steps
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Merge to main
6. Create GitHub release
7. Deploy to production

## 📞 Getting Help

### Communication
- GitHub Discussions for general questions
- GitHub Issues for bugs and features
- Email maintainers for security issues

### Resources
- [React Documentation](https://reactjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes for significant contributions

Thank you for contributing to make this project better! 🎉
