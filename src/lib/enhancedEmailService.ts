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

// Create Gmail transporter (matching invitation email system)
const createTransporter = () => {
  // Use Gmail configuration for all environments
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      'Gmail credentials not configured for enhanced email service. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.'
    );
    // Fallback to generic SMTP if Gmail not configured
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export class EnhancedEmailService {
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
              category: true,
              sectionTag: true,
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
          .score-badge { display: inline-block; background: ${percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444'}; color: white; padding: 15px 25px; border-radius: 30px; font-size: 28px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
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
      const fromEmail =
        process.env.GMAIL_USER ||
        process.env.SMTP_FROM ||
        'noreply@combatrobotics.in';
      const emailPromises = settings.notificationEmails.map((email) =>
        this.transporter.sendMail({
          from: `Combat Robotics India <${fromEmail}>`,
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
      console.error('Error sending test completion notification:', error);
      return false;
    }
  }
}

export const enhancedEmailService = new EnhancedEmailService();
