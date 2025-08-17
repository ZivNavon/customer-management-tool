# Customer Management Tool

A lightweight, local-first customer management tool for teams that handle multiple customers in English and Hebrew. 

## 🚀 Features

- **Customer Management**: CRUD operations for customers with logos, ARR tracking, and notes
- **Contact Management**: Store and manage customer contacts with roles, phones, and emails  
- **Meeting Logging**: Track meetings with screenshots, notes, and AI-powered summaries
- **AI Integration**: Auto-generate meeting summaries and email drafts
- **Multilingual Support**: Full EN/HE support with RTL layout for Hebrew
- **Local Deployment**: Docker-based deployment for single-user to small-team use

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, React Query
- **Backend**: FastAPI with PostgreSQL database
- **Deployment**: Docker Compose for local development
- **AI**: Integrated AI service for meeting summaries and email generation

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Python 3.11+ (for backend development)

## 🛠️ Quick Start

### Development Setup

1. **Clone and navigate to the project**:
   ```bash
   cd customers
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000

### Full Stack with Docker

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL database (port 5432)
   - FastAPI backend (port 8000)  
   - Next.js frontend (port 3000)

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
customers/
├── src/                     # Next.js frontend
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities (API, i18n)
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication
│   └── ai_service.py       # AI integration
├── docker-compose.yml      # Multi-service setup
└── README.md
```

## 🌐 Internationalization

The application supports English and Hebrew with automatic RTL layout switching:

- **Language Toggle**: Use the language switcher in the header
- **RTL Support**: Hebrew content displays with proper right-to-left layout
- **Persistent Settings**: Language preference is saved locally

## 🔧 Development

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Run migrations
alembic upgrade head
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Authentication and user management
- **Customers**: Customer information and ARR tracking
- **Contacts**: Customer contact information
- **Meetings**: Meeting records with date and notes
- **Meeting Assets**: Screenshots and file attachments
- **Meeting Summaries**: AI-generated summaries (versioned)
- **Email Drafts**: AI-generated email drafts (versioned)

## 🤖 AI Features

### Meeting Summaries
- Automatically processes meeting notes and uploaded screenshots
- Generates structured summaries with action items
- Supports both English and Hebrew output
- Maintains version history for edits

### Email Drafts  
- Creates professional email summaries from meeting content
- Uses customer contacts for TO/CC fields
- Editable before sending
- Maintains version history

## 🔒 Security

- **Authentication**: JWT-based authentication with httpOnly cookies
- **File Uploads**: MIME type validation and virus scanning support
- **Database**: Prepared statements and ORM protection
- **Environment**: Secure secret management

## 🚀 Deployment

### Local Development
```bash
docker-compose up -d
```

### Production Considerations
- Update environment variables in `.env`
- Configure proper database credentials
- Set up SSL certificates
- Configure backup strategies
- Set up monitoring and logging

## 📝 API Documentation

The FastAPI backend provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

- `GET /customers` - List customers
- `POST /customers` - Create customer
- `GET /customers/{id}` - Get customer details
- `POST /customers/{id}/meetings` - Create meeting
- `POST /meetings/{id}/ai/summarize` - Generate AI summary
- `POST /meetings/{id}/ai/draft-email` - Generate email draft

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests  
cd backend
pytest
```

## 📈 Roadmap

- [ ] Email sending integration
- [ ] Advanced search and filtering
- [ ] Calendar integration
- [ ] Mobile application
- [ ] Multi-tenant support
- [ ] Advanced AI features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Support

For support and questions:
- Check the documentation above
- Review API documentation at `/docs`
- Open an issue for bugs or feature requests

---

Built with ❤️ using Next.js, FastAPI, and modern web technologies.
