// Job Profile Notification Email Management
// This provides in-memory storage for job profile notification emails
// without requiring database schema changes

interface JobProfileNotificationConfig {
  jobProfileId: string;
  notificationEmails: string[];
  updatedAt: string;
}

// In-memory storage for notification configs
const notificationConfigs = new Map<string, JobProfileNotificationConfig>();

export class JobProfileNotificationManager {
  static setNotificationEmails(jobProfileId: string, emails: string[]): void {
    const config: JobProfileNotificationConfig = {
      jobProfileId,
      notificationEmails: emails.filter(
        (email) => email.trim() && email.includes('@')
      ),
      updatedAt: new Date().toISOString(),
    };
    notificationConfigs.set(jobProfileId, config);
  }

  static getNotificationEmails(jobProfileId: string): string[] {
    const config = notificationConfigs.get(jobProfileId);
    return config?.notificationEmails || [];
  }

  static removeNotificationConfig(jobProfileId: string): void {
    notificationConfigs.delete(jobProfileId);
  }

  static getAllConfigs(): JobProfileNotificationConfig[] {
    return Array.from(notificationConfigs.values());
  }

  static hasNotificationEmails(jobProfileId: string): boolean {
    const emails = this.getNotificationEmails(jobProfileId);
    return emails.length > 0;
  }
}
