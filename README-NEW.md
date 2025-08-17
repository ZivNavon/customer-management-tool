# Customer Management System

A comprehensive customer management application built with Next.js 15, TypeScript, and FastAPI. Features include customer relationship management, meeting scheduling with AI summaries, multilingual support (English/Hebrew), dark mode, and real-time dashboard analytics.

## 🚀 Features

- **Customer Management**: Complete CRUD operations for customer data
- **Meeting Management**: Schedule meetings with AI-powered summaries
- **Contact Management**: Organize and manage customer contacts
- **Dashboard Analytics**: Real-time statistics and risk assessment
- **Multilingual Support**: English and Hebrew with RTL layout support
- **Dark Mode**: Full dark mode implementation
- **Export/Import**: Data backup and restore functionality
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management
- **React Hook Form**: Form management
- **Heroicons**: Icon library
- **i18next**: Internationalization

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation
- **JWT Authentication**: Secure user authentication

### DevOps
- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **ESLint**: Code linting
- **TypeScript**: Type checking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd customers
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Environment Setup**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   DATABASE_URL=postgresql://username:password@localhost:5432/customers
   SECRET_KEY=your-secret-key
   ```

5. **Start Development Servers**
   
   Frontend:
   ```bash
   npm run dev
   ```
   
   Backend:
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Using Docker

```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── customers/       # Customer management pages
│   │   └── dashboard/       # Analytics dashboard
│   ├── components/          # Reusable React components
│   └── lib/                 # Utility functions and API calls
├── backend/                 # FastAPI backend
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication logic
│   └── main.py             # FastAPI application
├── public/                 # Static assets
├── .github/                # GitHub Actions workflows
└── docker-compose.yml     # Docker configuration
```

## 🔧 Development Workflow

### Git Workflow
We use a feature branch workflow:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** to the `develop` branch

### Commit Convention
We follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or updates

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
npm run test            # Run tests (placeholder)

# Backend
cd backend && uvicorn main:app --reload  # Start backend server
```

## 🎨 Features Overview

### Customer Management
- Add, edit, delete customers
- Contact information management
- Customer categorization and tagging
- Search and filtering capabilities

### Meeting Management
- Schedule meetings with customers
- Participant management with click-to-add interface
- AI-powered meeting summaries
- Meeting history and notes

### Dashboard Analytics
- Customer statistics overview
- Meeting activity tracking
- Risk assessment scoring
- Export capabilities for reports

### Internationalization
- English and Hebrew language support
- RTL (Right-to-Left) layout for Hebrew
- Dynamic language switching
- Localized date and number formatting

### Theme System
- Light and dark mode support
- System preference detection
- Persistent theme selection
- Smooth theme transitions

## 🚀 Deployment

### Production Build

```bash
# Frontend
npm run build

# Backend
cd backend
pip install -r requirements.txt
```

### Docker Deployment

```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required environment variables for production:

```env
# Frontend
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_ENV=production

# Backend
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-production-secret-key
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 🧪 Testing

```bash
# Frontend tests (when implemented)
npm run test
npm run test:watch

# Backend tests
cd backend
python -m pytest tests/
```

## 📚 API Documentation

When the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Review existing issues and discussions

## 🚧 Roadmap

- [ ] Add comprehensive testing suite
- [ ] Implement real-time notifications
- [ ] Add email integration
- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Integration with external CRM systems
