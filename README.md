# 🧠 IQ Test Platform

A comprehensive web-based IQ testing platform built with Next.js, featuring admin management, Google OAuth authentication, AI-powered proctoring, and robust question import capabilities.

**Last Deployment:** June 6, 2025 - Production Ready with AI Proctoring ✅

## ✨ Features

- **🔐 Admin Authentication**: Secure Google OAuth integration with role-based access
- **🤖 AI Proctoring**: Real-time face detection and object detection using custom AI models
- **📊 Test Management**: Create, edit, and manage IQ tests with multiple question types
- **📝 Question Import**: Excel/CSV import with validation and error handling
- **👥 User Management**: Super admin can manage other admin users
- **📈 Analytics**: Comprehensive test performance analytics with AI analysis
- **🏆 Leaderboard**: Real-time candidate rankings and performance comparison
- **📧 Invitations**: Send test invitations to participants
- **🎯 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js with Google OAuth
- **AI Services**: Custom MediaPipe + YOLO models on Google Cloud Run
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

# AI Proctoring Service (Optional - falls back to simulation if not provided)
CUSTOM_AI_SERVICE_URL="https://your-ai-service.run.app"
```

## 🤖 AI Proctoring System

### **Real-Time Analysis**
- **Face Detection**: MediaPipe-powered face presence monitoring
- **Object Detection**: YOLO-based detection of phones, books, electronics
- **Behavioral Analysis**: Tab switching, focus loss, copy/paste detection
- **Risk Scoring**: Automated suspicious activity scoring

### **Cost-Effective AI**
- **98% savings** vs Google Vision API (~$0.05 vs $3.00 per 1,000 images)
- **Custom models** running on Google Cloud Run
- **Auto-scaling** infrastructure with pay-per-use pricing

### **Monitoring & Management**

#### **Service Health**
```bash
# Check AI service status
curl https://ai-service-561500498824.us-central1.run.app/health
```

#### **Google Cloud Console Links**
- **[AI Service Metrics](https://console.cloud.google.com/run/detail/us-central1/ai-service/metrics?project=cri-ai-service-1749214504)**: Performance, latency, error rates
- **[Cloud Build History](https://console.cloud.google.com/cloud-build/builds?project=cri-ai-service-1749214504)**: Deployment logs and build status
- **[Billing Dashboard](https://console.cloud.google.com/billing/projects/cri-ai-service-1749214504)**: Cost tracking and usage analytics
- **[Error Reporting](https://console.cloud.google.com/errors?project=cri-ai-service-1749214504)**: AI service error monitoring

#### **Cost Monitoring**
- **Current Usage**: Monitor real-time costs in [GCP Billing](https://console.cloud.google.com/billing/)
- **Budget Alerts**: Set up alerts for unexpected usage spikes
- **Usage Patterns**: Track peak times and optimize scaling

#### **Performance Metrics**
- **Response Time**: Typically <2 seconds per frame analysis
- **Accuracy**: MediaPipe 95%+ face detection, YOLO 90%+ object detection
- **Availability**: 99.9% uptime with Cloud Run auto-scaling

### **Troubleshooting AI Issues**

#### **Service Not Responding**
```bash
# Check service logs
gcloud logs read --project=cri-ai-service-1749214504 --filter="resource.labels.service_name=ai-service"

# Restart service (redeploy)
gcloud run deploy ai-service --source=./ai-service --region=us-central1
```

#### **High Costs**
- Monitor usage in [billing dashboard](https://console.cloud.google.com/billing/)
- Adjust frame sampling rate in analysis settings
- Set up budget alerts for cost control

#### **Analysis Fallback**
- System automatically falls back to simulation if AI service unavailable
- No interruption to core testing functionality
- Admin dashboard shows analysis method used (Real AI vs Simulation)

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[AI Service Setup](./gcp-custom-ai-setup.md)**: Custom AI deployment guide
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

## 🆘 Support & Troubleshooting

### **Common Issues**

#### **Leaderboard Empty**
If the leaderboard shows no data even after test completions:
```bash
# Recreate the leaderboard database view
npx prisma db execute --file prisma/create-view.sql
```

#### **Database Schema Issues**
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Create/recreate database views (required for leaderboard)
npx prisma db execute --file prisma/create-view.sql
```

#### **Environment Variables**
- Ensure all required environment variables are set in `.env.local`
- Check that `DATABASE_URL` points to your PostgreSQL database
- Verify Google OAuth credentials are correctly configured

#### **AI Service Issues**
- Monitor service status: [GCP Console](https://console.cloud.google.com/run/detail/us-central1/ai-service/metrics?project=cri-ai-service-1749214504)
- Check logs: `gcloud logs read --project=cri-ai-service-1749214504`
- Service falls back to simulation automatically if unavailable

### **Support Resources**

- Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for setup issues
- Review the [Scripts README](./scripts/README.md) for admin management  
- Review the [AI Service Setup](./gcp-custom-ai-setup.md) for AI deployment
- Open an issue for bugs or feature requests

### **Quick Health Checks**

```bash
# Check database connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Verify AI service
curl https://ai-service-561500498824.us-central1.run.app/health

# Test application
npm run dev
```

---

**Built with ❤️ for Combat Robotics**
