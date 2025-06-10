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
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }

  // For production, use configured SMTP
  return nodemailer.createTransporter({
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
          score: true,
          completedAt: true,
        },
        orderBy: {
          score: 'desc',
        },
      });

      const totalAttempts = allAttempts.length;
      const scores = allAttempts.map((attempt) => attempt.score || 0);
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
              type: true,
              topic: true,
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
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: #4F46E5; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
          .score-badge { display: inline-block; background: ${percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444'}; color: white; padding: 10px 20px; border-radius: 25px; font-size: 24px; font-weight: bold; margin: 10px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: #F9FAFB; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; }
          .info-label { font-weight: bold; color: #6B7280; font-size: 12px; text-transform: uppercase; }
          .info-value { font-size: 18px; color: #111827; margin-top: 5px; }
          .analytics-section { margin-top: 30px; padding: 20px; background: #F3F4F6; border-radius: 8px; }
          .rank-badge { display: inline-block; background: #8B5CF6; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          .areas { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
          .strength { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; border-radius: 8px; }
          .improvement { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; border-radius: 8px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Test Completion Notification</h1>
            <p>${testTitle}</p>
          </div>

          <h2>Candidate Information</h2>
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

          <h2>Test Results</h2>
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

          <div class="footer">
            <p>This is an automated notification from CRI Test Application.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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
      console.error('Error sending test completion notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
