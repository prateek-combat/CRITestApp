# CRI Test Platform

A modern, production-ready assessment platform built with Next.js 15, featuring AI-powered proctoring, comprehensive analytics, and position-based leaderboards.

## 🚀 Tech Stack

- **Frontend**: Next.js 15.3.3, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase/Neon)
- **Authentication**: NextAuth.js v4 with Google OAuth
- **AI Proctoring**: Custom MediaPipe + YOLO models on Google Cloud Run
- **Deployment**: Vercel (production), Docker support

## ✨ Core Features

### Test Management
- Create and manage multiple-choice assessments
- Category-based question organization
- Excel/CSV bulk question import with validation
- Position-specific test assignments
- Configurable category weights per job profile

### AI-Powered Proctoring
- Real-time face detection and tracking
- Object detection (phones, books, electronics)
- Tab switching and focus monitoring
- Automated risk scoring and alerts
- Frame-by-frame analysis with detailed reports

### Analytics & Reporting
- Position-based leaderboards
- Comprehensive performance analytics
- AI-generated insights and recommendations
- Category-wise performance breakdown
- Export capabilities (Excel, PDF)

### User Management
- Role-based access (SUPER_ADMIN, ADMIN)
- Google OAuth authentication
- Public test links for external candidates
- Invitation system with email notifications

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Console project (for OAuth)
- SMTP server (for email notifications)

## 🛠️ Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd CRITestApp
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Create Super Admin**
   ```bash
   node scripts/add-admin.js admin@company.com "Admin" "User" "SUPER_ADMIN"
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Security Configuration

### Environment Variables

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets**:
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

3. **Configure credentials**:
   - Never commit `.env` files to version control
   - Use different credentials for development and production
   - Rotate secrets regularly
   - Store production secrets in secure environment variable services

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Authentication (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration (Required for invitations)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-specific-password"
```

### Security Best Practices

1. **Authentication**:
   - All admin users must be pre-registered in the database
   - Use Google OAuth for authentication (no hardcoded credentials)
   - Session tokens expire after 30 days

2. **Authorization**:
   - Middleware protects all admin and API routes
   - Role-based access control (ADMIN, SUPER_ADMIN)
   - File access is restricted to authorized users only

3. **Data Protection**:
   - All passwords are hashed with bcrypt
   - Database queries use parameterized statements (Prisma)
   - File uploads are validated and access-controlled

4. **Production Security**:
   - Enable HTTPS in production
   - Set secure cookie flags
   - Implement rate limiting
   - Regular security audits

## 📁 Project Structure

```
CRITestApp/
├── src/
│   ├── app/              # Next.js 15 app directory
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── api/          # API routes
│   │   ├── login/        # Authentication pages
│   │   └── test/         # Test-taking interface
│   ├── components/       # Reusable React components
│   ├── lib/             # Utilities and configurations
│   └── types/           # TypeScript definitions
├── prisma/              # Database schema
├── public/              # Static assets
├── scripts/             # Utility scripts
├── config/              # Configuration files
│   ├── jest/            # Jest test config
│   └── playwright/      # E2E test config
├── docker/              # Docker configurations
└── docs/                # Documentation
```

## 🔒 Security Features

- Pre-registered admin emails only
- Session-based authentication with secure cookies
- Input validation and sanitization
- Rate limiting on API endpoints
- File upload restrictions and validation
- XSS and CSRF protection

## 🏆 Quality Assurance

The project maintains high code quality through:

- **Comprehensive Testing**: Unit tests, integration tests, and E2E testing
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Code Quality**: ESLint rules enforced with pre-commit hooks
- **Continuous Integration**: Automated testing on all pull requests
- **Security Audits**: Regular dependency vulnerability scanning
- **Performance Monitoring**: Build optimization and bundle analysis

## 🧪 Testing

```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Run all CI checks locally
npm run lint              # ESLint checks
npm run test:ci          # Jest tests with coverage
npm run build            # TypeScript & Next.js build
```

### CI/CD Status
✅ **All tests passing** - The project has continuous integration configured with:
- ESLint for code quality
- Jest for unit and integration tests  
- TypeScript type checking
- Docker build verification
- Automated deployments via GitHub Actions

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -f docker/Dockerfile -t cri-test-app .
docker run -p 3000:3000 --env-file .env cri-test-app
```

## 📊 Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## 🤖 AI Proctoring Setup

The platform includes AI-powered proctoring with automatic fallback to simulation mode if the AI service is unavailable.

For production AI proctoring:
1. Deploy the AI service to Google Cloud Run
2. Set `CUSTOM_AI_SERVICE_URL` in environment variables
3. Monitor usage and costs via Google Cloud Console

See [AI Service Setup Guide](docs/setup/gcp-custom-ai-setup.md) for detailed instructions.

## 📚 Documentation

- [Local Development Guide](docs/setup/LOCAL_DEVELOPMENT.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Email Setup](docs/deployment/EMAIL_SETUP.md)
- [Proctoring Setup](docs/deployment/PROCTORING_SETUP.md)

## 🛟 Troubleshooting

### Database Issues
```bash
# Reset database
npx prisma db push --force-reset

# Check connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Build Issues
```bash
# Clear caches
rm -rf .next node_modules
npm install
npm run build
```

### Authentication Issues
- Verify Google OAuth credentials
- Check `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Current Version**: 1.0.0  
**Last Updated**: July 2025  
**Status**: Production Ready ✅ All CI/CD Tests Passing