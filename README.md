# 🧠 IQ Test Platform

A comprehensive web-based IQ testing platform built with Next.js, featuring admin management, Google OAuth authentication, and robust question import capabilities.

**Last Deployment:** June 4, 2025 - Production Ready ✅

## ✨ Features

- **🔐 Admin Authentication**: Secure Google OAuth integration with role-based access
- **📊 Test Management**: Create, edit, and manage IQ tests with multiple question types
- **📝 Question Import**: Excel/CSV import with validation and error handling
- **👥 User Management**: Super admin can manage other admin users
- **📈 Analytics**: Comprehensive test performance analytics
- **📧 Invitations**: Send test invitations to participants
- **🎯 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js with Google OAuth
- **File Processing**: Papa Parse for CSV, SheetJS for Excel
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Google Cloud Console project for OAuth

## 🛠️ Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iq-test-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   npm run setup:env
   # Then edit .env with your actual values
   ```

3. **Database Setup**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Create Super Admin**
   ```bash
   node scripts/add-admin.js admin@yourcompany.com "Admin" "User" "SUPER_ADMIN"
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[Admin Scripts](./scripts/README.md)**: User management and utilities

## 🏗️ Project Structure

```
iq-test-app/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── admin/          # Admin panel pages
│   │   ├── api/            # API routes
│   │   └── test/           # Test taking interface
│   ├── components/         # Reusable components
│   ├── lib/               # Utilities and configuration
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema and migrations
├── scripts/               # Management scripts
└── public/                # Static assets
```

## 🔒 Security Features

- Role-based access control (ADMIN, SUPER_ADMIN)
- Pre-registered admin emails only
- Session-based authentication
- Input validation and sanitization
- File upload restrictions

## 🚀 Deployment

For production deployment, see the comprehensive [Deployment Guide](./DEPLOYMENT_GUIDE.md).

Quick deployment to Vercel:
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run build`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for setup issues
- Review the [Scripts README](./scripts/README.md) for admin management
- Open an issue for bugs or feature requests

---

**Built with ❤️ for Combat Robotics**
