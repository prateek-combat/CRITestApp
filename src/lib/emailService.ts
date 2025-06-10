import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface TestCompletionData {
  testId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  score: number;
  maxScore: number;
  completedAt: Date;
  timeTaken: number;
  answers: any[];
}

interface TestAnalytics {
  totalAttempts: number;
  averageScore: number;
  rank: number;
  percentile: number;
  topScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  strengthAreas: string[];
  improvementAreas: string[];
}

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  notificationEmails: string[];
  includeAnalytics: boolean;
}

// Create transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, use Ethereal Email (fake SMTP)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }

  // For production, use configured SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  async getTestNotificationSettings(
    testId: string
  ): Promise<NotificationSettings | null> {
    try {
      const test = await prisma.test.findUnique({
        where: { id: testId },
        select: {
          emailNotificationsEnabled: true,
          notificationEmails: true,
          includeAnalytics: true,
        },
      });

      return test;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  async calculateTestAnalytics(
    testId: string,
    currentScore: number
  ): Promise<TestAnalytics> {
    try {
      // Get all completed test attempts for this test
      const allAttempts = await prisma.testAttempt.findMany({
        where: {
          testId,
          status: 'COMPLETED',
        },
        select: {
          rawScore: true,
          completedAt: true,
        },
        orderBy: {
          rawScore: 'desc',
        },
      });

      const totalAttempts = allAttempts.length;
      const scores = allAttempts.map((attempt) => attempt.rawScore || 0);
      const averageScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      const topScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Calculate rank (1-based)
      const betterScores = scores.filter(
        (score) => score > currentScore
      ).length;
      const rank = betterScores + 1;

      // Calculate percentile
      const worseScores = scores.filter((score) => score < currentScore).length;
      const percentile =
        totalAttempts > 1
          ? Math.round((worseScores / (totalAttempts - 1)) * 100)
          : 100;

      // Determine difficulty based on average score
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (averageScore >= 80) difficulty = 'Easy';
      else if (averageScore <= 50) difficulty = 'Hard';

      // Get test questions for analysis
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
          questions: {
            select: {
              id: true,
              questionType: true,
              category: true,
            },
          },
        },
      });

      // Analyze strength and improvement areas (simplified)
      const strengthAreas: string[] = [];
      const improvementAreas: string[] = [];

      // This is a simplified analysis - in a real application, you'd want to
      // analyze individual question performance
      if (currentScore >= 80) {
        strengthAreas.push('Overall Performance', 'Problem Solving');
      } else if (currentScore >= 60) {
        strengthAreas.push('Basic Concepts');
        improvementAreas.push('Advanced Topics');
      } else {
        improvementAreas.push('Fundamental Concepts', 'Practice Required');
      }

      return {
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        rank,
        percentile,
        topScore,
        difficulty,
        strengthAreas,
        improvementAreas,
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      // Return default analytics in case of error
      return {
        totalAttempts: 1,
        averageScore: 0,
        rank: 1,
        percentile: 100,
        topScore: currentScore,
        difficulty: 'Medium',
        strengthAreas: [],
        improvementAreas: [],
      };
    }
  }

  generateEmailHTML(
    testTitle: string,
    candidateName: string,
    candidateEmail: string,
    score: number,
    maxScore: number,
    timeTaken: number,
    analytics?: TestAnalytics
  ): string {
    const percentage = Math.round((score / maxScore) * 100);
    const timeFormatted = this.formatTime(timeTaken);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Completion Notification</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 700px; margin: 0 auto; background: white; padding: 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: #4A5D23; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
          .content { padding: 30px; }
          .test-overview { background: linear-gradient(135deg, #f0f4e8 0%, #d9e4c4 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #4A5D23; }
          .test-overview h2 { color: #4A5D23; margin: 0 0 15px 0; font-size: 20px; display: flex; align-items: center; }
          .test-overview h2::before { content: "📝"; margin-right: 10px; }
          .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .overview-item { background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; }
          .overview-label { font-weight: 600; color: #4A5D23; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .overview-value { color: #323f17; font-size: 14px; margin-top: 2px; }
          .guidelines { background: #fef7ec; border-left: 5px solid #F5821F; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .guidelines h3 { color: #F5821F; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center; }
          .guidelines h3::before { content: "🔒"; margin-right: 10px; }
          .guideline-item { display: flex; align-items: flex-start; margin: 10px 0; padding: 8px; background: rgba(245,130,31,0.1); border-radius: 6px; }
          .guideline-icon { margin-right: 10px; font-size: 18px; }
          .guideline-text { color: #c25b16; font-weight: 500; }
          .score-badge { display: inline-block; background: ${
            percentage >= 80
              ? '#10B981'
              : percentage >= 60
                ? '#F59E0B'
                : '#EF4444'
          }; color: white; padding: 15px 25px; border-radius: 30px; font-size: 28px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
          .info-item { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #4A5D23; transition: transform 0.2s; }
          .info-item:hover { transform: translateY(-2px); }
          .info-label { font-weight: bold; color: #6C757D; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 18px; color: #212529; margin-top: 8px; font-weight: 600; }
          .analytics-section { margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #f0f4e8 0%, #e8f0d8 100%); border-radius: 12px; border: 1px solid #d9e4c4; }
          .analytics-section h2 { color: #4A5D23; margin: 0 0 20px 0; }
          .rank-badge { display: inline-block; background: #4A5D23; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; margin-right: 10px; }
          .areas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .strength { background: #D1FAE5; border-left: 5px solid #10B981; padding: 20px; border-radius: 10px; }
          .improvement { background: #FEE2E2; border-left: 5px solid #EF4444; padding: 20px; border-radius: 10px; }
          .cta-section { text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #4A5D23 0%, #3e4e1d 100%); border-radius: 12px; }
          .cta-button { display: inline-block; background: #F5821F; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; transition: all 0.3s; }
          .cta-button:hover { background: #e4751c; transform: translateY(-2px); }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 14px; }
          .footer p { margin: 5px 0; }
          .company-branding { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; }
          .company-branding strong { color: #4A5D23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Test Completion Notification</h1>
            <p>${testTitle}</p>
          </div>
          
          <div class="content">
            <div class="test-overview">
              <h2>Test Overview</h2>
              <div class="overview-grid">
                <div class="overview-item">
                  <div class="overview-label">Test Name</div>
                  <div class="overview-value">${testTitle}</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">Total Questions</div>
                  <div class="overview-value">${maxScore} questions</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">Time Allocation</div>
                  <div class="overview-value">~${Math.round((timeTaken / maxScore / 60) * 100) / 100} min per question</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">Total Duration</div>
                  <div class="overview-value">${timeFormatted}</div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <div class="overview-label">Topics Covered</div>
                <div class="overview-value">Core electronics concepts, circuit analysis, embedded systems basics, and logical reasoning</div>
              </div>
            </div>

            <div class="guidelines">
              <h3>Important Test Guidelines</h3>
              <p style="color: #c25b16; margin-bottom: 15px; font-style: italic;">This assessment was monitored for fairness and integrity:</p>
              
              <div class="guideline-item">
                <span class="guideline-icon">🎥</span>
                <div class="guideline-text">Video Recording: Session was recorded via webcam</div>
              </div>
              
              <div class="guideline-item">
                <span class="guideline-icon">🎙️</span>
                <div class="guideline-text">Audio Recording: Audio was captured throughout the test</div>
              </div>
              
              <div class="guideline-item">
                <span class="guideline-icon">🔄</span>
                <div class="guideline-text">Tab Switch Monitoring: Browser activity was monitored</div>
              </div>
              
              <div class="guideline-item">
                <span class="guideline-icon">⏱️</span>
                <div class="guideline-text">Single Attempt: Test completed in one session</div>
              </div>
            </div>

            <h2 style="color: #4A5D23; margin: 30px 0 20px 0;">Candidate Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Candidate Name</div>
                <div class="info-value">${candidateName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${candidateEmail}</div>
              </div>
            </div>

            <h2 style="color: #4A5D23; margin: 30px 0 20px 0;">Test Results</h2>
            <div style="text-align: center;">
              <div class="score-badge">${score}/${maxScore} (${percentage}%)</div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Time Taken</div>
                <div class="info-value">${timeFormatted}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Completion Status</div>
                <div class="info-value">✅ Completed</div>
              </div>
            </div>

            ${
              analytics
                ? `
            <div class="analytics-section">
              <h2>📊 Performance Analytics</h2>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Rank</div>
                  <div class="info-value">
                    <span class="rank-badge">#${analytics.rank}</span>
                    <small>out of ${analytics.totalAttempts} candidates</small>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Percentile</div>
                  <div class="info-value">${analytics.percentile}th percentile</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Test Average</div>
                  <div class="info-value">${analytics.averageScore}%</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Difficulty Level</div>
                  <div class="info-value">${analytics.difficulty}</div>
                </div>
              </div>

              ${
                analytics.strengthAreas.length > 0 ||
                analytics.improvementAreas.length > 0
                  ? `
              <div class="areas">
                ${
                  analytics.strengthAreas.length > 0
                    ? `
                <div class="strength">
                  <h3>💪 Strengths</h3>
                  <ul>
                    ${analytics.strengthAreas.map((area) => `<li>${area}</li>`).join('')}
                  </ul>
                </div>
                `
                    : ''
                }
                
                ${
                  analytics.improvementAreas.length > 0
                    ? `
                <div class="improvement">
                  <h3>📈 Areas for Improvement</h3>
                  <ul>
                    ${analytics.improvementAreas.map((area) => `<li>${area}</li>`).join('')}
                  </ul>
                </div>
                `
                    : ''
                }
              </div>
              `
                  : ''
              }
            </div>
            `
                : ''
            }

            <div class="cta-section">
              <h3 style="color: white; margin: 0 0 15px 0;">Assessment Complete</h3>
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 16px;">
                This assessment has been completed successfully and results have been recorded.
              </p>
              <a href="#" class="cta-button">View Full Analytics Dashboard</a>
            </div>

            <div class="company-branding">
              <p><strong>Combat Robotics India</strong> - Excellence in Technical Assessment</p>
              <p style="font-size: 12px; color: #6C757D;">Empowering talent through comprehensive evaluation</p>
            </div>

            <div class="footer">
              <p>This is an automated notification from <strong>CRI Test Application</strong>.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p style="font-size: 12px; margin-top: 10px;">
                For support or questions, please contact the assessment team.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  async sendTestCompletionNotification(
    data: TestCompletionData
  ): Promise<boolean> {
    try {
      // Send notification to admins (existing functionality)
      const adminNotificationSent =
        await this.sendAdminTestCompletionNotification(data);

      // Send confirmation email to test taker
      const candidateNotificationSent =
        await this.sendCandidateConfirmationEmail(data);

      return adminNotificationSent || candidateNotificationSent; // Return true if at least one email was sent
    } catch (error) {
      console.error('Error sending test completion notifications:', error);
      return false;
    }
  }

  private async sendAdminTestCompletionNotification(
    data: TestCompletionData
  ): Promise<boolean> {
    try {
      // Get notification settings for this test
      const settings = await this.getTestNotificationSettings(data.testId);

      if (
        !settings ||
        !settings.emailNotificationsEnabled ||
        settings.notificationEmails.length === 0
      ) {
        console.log(
          'Email notifications disabled or no recipients configured for test:',
          data.testId
        );
        return true; // Not an error, just disabled
      }

      // Get test details
      const test = await prisma.test.findUnique({
        where: { id: data.testId },
        select: { title: true },
      });

      if (!test) {
        console.error('Test not found:', data.testId);
        return false;
      }

      // Calculate analytics if enabled
      let analytics: TestAnalytics | undefined;
      if (settings.includeAnalytics) {
        analytics = await this.calculateTestAnalytics(data.testId, data.score);
      }

      // Generate email content
      const emailHTML = this.generateEmailHTML(
        test.title,
        data.candidateName,
        data.candidateEmail,
        data.score,
        data.maxScore,
        data.timeTaken,
        analytics
      );

      const subject = `Test Completion: ${test.title} - ${data.candidateName} (${Math.round((data.score / data.maxScore) * 100)}%)`;

      // Send email to all configured recipients
      const emailPromises = settings.notificationEmails.map((email) =>
        this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@combatrobotics.in',
          to: email,
          subject,
          html: emailHTML,
        })
      );

      await Promise.all(emailPromises);
      console.log(
        `Test completion notification sent for test ${data.testId} to ${settings.notificationEmails.length} recipients`
      );
      return true;
    } catch (error) {
      console.error('Error sending admin test completion notification:', error);
      return false;
    }
  }

  async sendCandidateConfirmationEmail(
    data: TestCompletionData
  ): Promise<boolean> {
    try {
      // Get test details
      const test = await prisma.test.findUnique({
        where: { id: data.testId },
        select: { title: true, description: true },
      });

      if (!test) {
        console.error('Test not found:', data.testId);
        return false;
      }

      // Generate candidate confirmation email content
      const emailHTML = this.generateCandidateConfirmationHTML(
        test.title,
        data.candidateName,
        data.candidateEmail,
        data.completedAt
      );

      const subject = `Test Submission Confirmed - ${test.title}`;

      // Send confirmation email to candidate
      await this.transporter.sendMail({
        from: `Combat Robotics India <${process.env.SMTP_FROM || 'noreply@combatrobotics.in'}>`,
        to: data.candidateEmail,
        subject,
        html: emailHTML,
        text: `Dear ${data.candidateName},

Thank you for completing the ${test.title} assessment. Your test responses have been successfully recorded and submitted.

What happens next?
Our team will review your submission and may contact you regarding the next steps in the evaluation process.

If you have any questions or concerns about your test submission, please don't hesitate to contact us.

Best regards,
Combat Robotics India Team

This is an automated confirmation email. Please do not reply to this message.`,
      });

      console.log(
        `Candidate confirmation email sent to ${data.candidateEmail} for test ${data.testId}`
      );
      return true;
    } catch (error) {
      console.error('Error sending candidate confirmation email:', error);
      return false;
    }
  }

  generateCandidateConfirmationHTML(
    testTitle: string,
    candidateName: string,
    candidateEmail: string,
    completedAt: Date
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Submission Confirmed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            margin-bottom: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #059669 0%, #047857 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            font-size: 28px; 
            margin-bottom: 8px; 
            font-weight: 700; 
          }
          .header p { 
            font-size: 16px; 
            opacity: 0.9; 
          }
          .content { 
            padding: 30px 20px; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #1f2937; 
            font-weight: 600; 
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 25px; 
            color: #4b5563; 
            line-height: 1.7; 
          }
          .test-info { 
            background-color: #f0fdf4; 
            border-left: 4px solid #22c55e; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 8px 8px 0; 
          }
          .test-info h3 { 
            color: #15803d; 
            margin-bottom: 10px; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .test-info p { 
            color: #166534; 
            margin-bottom: 8px; 
            font-size: 14px; 
          }
          .next-steps { 
            background-color: #eff6ff; 
            border-left: 4px solid #3b82f6; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 8px 8px 0; 
          }
          .next-steps h3 { 
            color: #1d4ed8; 
            margin-bottom: 10px; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .next-steps p { 
            color: #1e40af; 
            font-size: 14px; 
            line-height: 1.6; 
          }
          .contact-info { 
            background-color: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 8px 8px 0; 
          }
          .contact-info h3 { 
            color: #d97706; 
            margin-bottom: 10px; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .contact-info p { 
            color: #92400e; 
            font-size: 14px; 
            line-height: 1.6; 
          }
          .footer { 
            background-color: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { 
            color: #6b7280; 
            font-size: 12px; 
            margin-bottom: 5px; 
          }
          .company-branding { 
            text-align: center; 
            margin: 20px 0; 
          }
          .company-branding h4 { 
            color: #1f2937; 
            font-size: 18px; 
            font-weight: 700; 
            margin-bottom: 5px; 
          }
          .company-branding p { 
            color: #6b7280; 
            font-size: 14px; 
          }
          .success-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Test Submission Confirmed</h1>
            <p>Your assessment has been successfully recorded</p>
          </div>

          <div class="content">
            <div class="greeting">
              Dear ${candidateName},
            </div>

            <div class="message">
              Thank you for completing your assessment with Combat Robotics India. 
              This email confirms that your test responses have been successfully recorded and submitted.
            </div>

            <div class="test-info">
              <h3>Submission Details</h3>
              <p><strong>Test:</strong> ${testTitle}</p>
              <p><strong>Candidate:</strong> ${candidateName}</p>
              <p><strong>Email:</strong> ${candidateEmail}</p>
              <p><strong>Submitted on:</strong> ${completedAt.toLocaleString()}</p>
              <p><strong>Status:</strong> Successfully Recorded</p>
            </div>

            <div class="next-steps">
              <h3>What Happens Next?</h3>
              <p>
                Our team will carefully review your submission and evaluate your responses. 
                We may contact you regarding the next steps in the evaluation process. 
                Please keep an eye on your email for any further communication from our team.
              </p>
            </div>

            <div class="contact-info">
              <h3>Questions or Concerns?</h3>
              <p>
                If you have any questions about your test submission or the evaluation process, 
                please don't hesitate to contact our team. We're here to help and ensure 
                you have the best possible experience with our assessment platform.
              </p>
            </div>

            <div class="company-branding">
              <h4>Combat Robotics India</h4>
              <p>Excellence in Technical Assessment</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>Combat Robotics India</strong> - Technical Assessment Platform</p>
            <p>This is an automated confirmation email. Please do not reply to this message.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
