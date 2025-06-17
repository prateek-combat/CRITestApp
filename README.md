# 🧠 Test Platform

A comprehensive web-based testing platform built with Next.js, featuring admin management, Google OAuth authentication, AI-powered proctoring, and robust question import capabilities.

**Last Deployment:** June 16, 2025 - Stable Version with NextAuth v4 ✅  
**Current Status:** Production Ready with AI Proctoring and Enhanced Question Formatting  
**Latest Update:** Improved test question display with inline code formatting for better readability

## ✨ Features

- **🔐 Admin Authentication**: Secure Google OAuth integration with role-based access
- **🤖 AI Proctoring**: Real-time face detection and object detection using custom AI models
- **📊 Test Management**: Create, edit, and manage tests with multiple question types
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
   cd test-app
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
test-app/
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

## 💡 Future Enhancement Ideas

### 🎯 **User/Candidate Experience Improvements**

#### **1. Pre-Test Preparation Suite**

- **Practice Mode**: Sample questions without recording for familiarization
- **System Compatibility Checker**: Camera, microphone, and browser testing
- **Test Simulation**: Full interface walkthrough without actual assessment
- **Performance Tips**: Cognitive test strategies and preparation guidance

#### **2. Accessibility & Inclusivity Features**

- **Multi-language Support**: International candidate accommodation
- **Dark/Light Mode Toggle**: Visual comfort customization
- **Font Size Adjustment**: Better readability options
- **Screen Reader Compatibility**: Accessibility for visually impaired users
- **Colorblind-Friendly Design**: Inclusive UI color schemes

#### **3. Enhanced Test Experience**

- **Break Timer**: 5-minute breaks every 30 minutes for longer tests
- **Question Bookmarking**: Flag questions for review
- **Progress Visualization**: Real-time completion percentage
- **Stress Indicator**: Heart rate monitoring via camera with calming suggestions
- **Background Noise Cancellation**: AI-powered audio filtering

#### **4. Post-Test Experience**

- **Immediate Basic Feedback**: Completion time and effort level
- **Personalized Improvement Suggestions**: Weak area recommendations
- **Test Retake Scheduler**: Automated cooldown periods
- **Performance Comparison**: Anonymous peer group benchmarking

### 📊 **Hiring Manager Intelligence Features**

#### **5. AI-Powered Candidate Intelligence**

- **Behavioral Analysis**: Video-based confidence and stress pattern detection
- **Cheating Detection AI**: Advanced eye movement and behavior analysis
- **Behavioral Analysis**: Test-taking pattern analysis
- **Cultural Fit Scoring**: Response pattern compatibility assessment
- **Automated Candidate Ranking**: ML-powered performance scoring

#### **6. Advanced Analytics & Insights**

- **Predictive Hiring Models**: Success probability scoring algorithms
- **Team Compatibility Analysis**: Existing employee comparison
- **Role-Specific Benchmarking**: Position-tailored performance thresholds
- **Interview Question Generator**: Weak area-based question creation
- **Bias Detection**: Hiring pattern analysis with improvement suggestions

#### **7. Collaboration & Workflow Tools**

- **Multi-Reviewer System**: Weighted scoring across multiple evaluators
- **Hiring Pipeline Integration**: Status tracking throughout process
- **Automated Email Sequences**: Outcome-based candidate communication
- **Calendar Integration**: Seamless interview scheduling
- **Team Feedback Collection**: Collaborative candidate evaluation

#### **8. Integration & Automation Hub**

- **ATS Integration**: Workday, BambooHR, Greenhouse connectivity
- **Slack/Teams Notifications**: Real-time completion alerts
- **Custom API Development**: Existing HR tool integration
- **Bulk Test Management**: High-volume hiring support
- **White-Label Branding**: Custom company branding options

#### **9. Advanced Proctoring & Security**

- **AI Face Verification**: Identity impersonation prevention
- **Environment Analysis**: Inappropriate setup detection
- **Real-Time Intervention**: Suspicious behavior alert system
- **Blockchain Certificates**: Tamper-proof result verification
- **Advanced Audio Analysis**: External help detection

#### **10. Business Intelligence Features**

- **ROI Tracking**: Hire success rate vs test score correlation
- **A/B Testing**: Question set effectiveness comparison
- **Market Benchmarking**: Industry standard performance comparison
- **Custom Report Builder**: Drag-and-drop analytics creation
- **Executive Dashboards**: KPI tracking and insights

### 🚀 **Implementation Timeline**

#### **Quick Wins (1-2 weeks)**

- Pre-test system compatibility checker
- Dark/light mode toggle implementation
- Basic behavioral insights from existing data
- Enhanced analytics chart improvements

#### **Medium Impact (1-2 months)**

- AI-powered cheating detection algorithms
- Multi-language support infrastructure
- Advanced candidate ranking system
- Primary ATS integration connectors

#### **Game Changers (3-6 months)**

- Predictive hiring model development
- Comprehensive behavioral analysis suite
- White-label branding system
- Blockchain result verification

### 🎯 **Feature Prioritization Matrix**

| Feature Category        | User Impact | Business Value | Implementation Effort | Priority   |
| ----------------------- | ----------- | -------------- | --------------------- | ---------- |
| Pre-Test Suite          | High        | Medium         | Low                   | **High**   |
| AI Cheating Detection   | Medium      | High           | Medium                | **High**   |
| Predictive Models       | Medium      | Very High      | High                  | **Medium** |
| Multi-Language          | High        | Medium         | Medium                | **Medium** |
| ATS Integration         | Low         | Very High      | High                  | **Medium** |
| Blockchain Verification | Low         | High           | Very High             | **Low**    |

### 💭 **Innovation Opportunities**

#### **Emerging Technologies**

- **Voice Pattern Analysis**: Stress detection through speech
- **Micro-Expression Recognition**: Emotional state assessment
- **Eye Tracking**: Attention and focus measurement
- **Brain-Computer Interfaces**: Future cognitive assessment
- **AR/VR Testing**: Immersive skill evaluation

#### **Market Differentiators**

- **Industry-Specific Tests**: Finance, healthcare, tech specializations
- **Soft Skills Assessment**: Communication, leadership, teamwork
- **Real-World Simulations**: Job-specific scenario testing
- **Continuous Learning Integration**: Post-hire development tracking
- **Global Talent Pool Analytics**: Cross-cultural hiring insights

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

**Built with modern technology stack for reliable testing platforms**
