/**
 * Shared Risk Calculator Utility
 * Centralizes risk calculation logic for proctoring events
 */

import {
  PROCTORING_RISK_WEIGHTS,
  PROCTORING_RISK_THRESHOLDS,
} from './constants';

export interface ProctorEvent {
  type: string;
  timestamp: number;
  extra?: Record<string, any>;
}

export interface RiskAnalysis {
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  eventCounts: Record<string, number>;
  temporalPatternScore: number;
  recommendations: string[];
}

export class RiskCalculator {
  /**
   * Calculate risk score from proctoring events
   */
  static calculateRiskScore(events: ProctorEvent[]): RiskAnalysis {
    const eventCounts: Record<string, number> = {};
    let totalScore = 0;

    // Calculate base score from events
    events.forEach((event) => {
      const eventType = event.type;
      const weight =
        PROCTORING_RISK_WEIGHTS[
          eventType as keyof typeof PROCTORING_RISK_WEIGHTS
        ] || 1.0;

      // Count occurrences
      eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;

      // Apply diminishing returns for repeated events
      const occurrenceMultiplier = Math.min(
        1.0 + (eventCounts[eventType] - 1) * 0.3,
        2.0
      );

      // Calculate score for this event
      const eventScore = weight * occurrenceMultiplier;

      // Apply context-based adjustments
      const adjustedScore = this.applyContextAdjustments(event, eventScore);

      totalScore += adjustedScore;
    });

    // Calculate temporal pattern score
    const temporalPatternScore = this.calculateTemporalPatterns(events);
    totalScore += temporalPatternScore;

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      eventCounts,
      riskLevel
    );

    return {
      totalScore,
      riskLevel,
      eventCounts,
      temporalPatternScore,
      recommendations,
    };
  }

  /**
   * Apply context-based adjustments to event scores
   */
  private static applyContextAdjustments(
    event: ProctorEvent,
    baseScore: number
  ): number {
    let adjustedScore = baseScore;

    // Adjust based on event-specific context
    if (event.extra) {
      // High confidence detections get higher weight
      if (event.extra.confidence && event.extra.confidence > 0.8) {
        adjustedScore *= 1.2;
      }

      // Multiple people detected is more serious
      if (event.type === 'MULTIPLE_PEOPLE' && event.extra.person_count > 2) {
        adjustedScore *= 1.5;
      }

      // Repeated tab switches in short time are more suspicious
      if (event.type === 'TAB_HIDDEN' && event.extra.duration < 5) {
        adjustedScore *= 0.8; // Brief tab switch, less suspicious
      }
    }

    return adjustedScore;
  }

  /**
   * Calculate additional risk based on temporal patterns
   */
  private static calculateTemporalPatterns(events: ProctorEvent[]): number {
    if (events.length < 2) return 0;

    let patternScore = 0;
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    // Check for clustering of suspicious events
    const suspiciousTypes = [
      'PHONE_DETECTED',
      'MULTIPLE_PEOPLE',
      'DEVTOOLS_DETECTED',
    ];
    const clusters = this.findEventClusters(
      sortedEvents,
      suspiciousTypes,
      60000
    ); // 60 second window

    // Score clusters
    clusters.forEach((cluster) => {
      patternScore += cluster.length * 2.0; // 2 points per event in cluster
    });

    // Check for repetitive behavior patterns
    const tabSwitches = sortedEvents.filter((e) => e.type === 'TAB_HIDDEN');
    if (tabSwitches.length > 5) {
      patternScore += Math.min(tabSwitches.length * 0.5, 10.0);
    }

    return patternScore;
  }

  /**
   * Find clusters of events within a time window
   */
  private static findEventClusters(
    events: ProctorEvent[],
    targetTypes: string[],
    windowMs: number
  ): ProctorEvent[][] {
    const clusters: ProctorEvent[][] = [];
    let currentCluster: ProctorEvent[] = [];

    events.forEach((event) => {
      if (targetTypes.includes(event.type)) {
        if (currentCluster.length === 0) {
          currentCluster = [event];
        } else {
          const timeDiff =
            event.timestamp -
            currentCluster[currentCluster.length - 1].timestamp;
          if (timeDiff <= windowMs) {
            currentCluster.push(event);
          } else {
            if (currentCluster.length > 1) {
              clusters.push(currentCluster);
            }
            currentCluster = [event];
          }
        }
      }
    });

    // Add final cluster if it exists
    if (currentCluster.length > 1) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  /**
   * Determine risk level based on total score
   */
  private static determineRiskLevel(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= PROCTORING_RISK_THRESHOLDS.HIGH * 1.5) {
      return 'critical';
    } else if (score >= PROCTORING_RISK_THRESHOLDS.HIGH) {
      return 'high';
    } else if (score >= PROCTORING_RISK_THRESHOLDS.MEDIUM) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate recommendations based on detected events
   */
  private static generateRecommendations(
    eventCounts: Record<string, number>,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Manual review strongly recommended');
    }

    if (eventCounts.PHONE_DETECTED > 0) {
      recommendations.push('Phone usage detected - verify test integrity');
    }

    if (eventCounts.MULTIPLE_PEOPLE > 0) {
      recommendations.push(
        'Multiple people detected - possible unauthorized assistance'
      );
    }

    if (eventCounts.DEVTOOLS_DETECTED > 0) {
      recommendations.push(
        'Developer tools usage detected - possible cheating attempt'
      );
    }

    if (eventCounts.TAB_HIDDEN > 10) {
      recommendations.push(
        'Excessive tab switching - review for external resource usage'
      );
    }

    if (eventCounts.COPY_DETECTED > 5 || eventCounts.PASTE_DETECTED > 5) {
      recommendations.push('High copy/paste activity - check for plagiarism');
    }

    return recommendations;
  }
}
