import jsPDF from 'jspdf';

export interface PersonalityDimension {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface TestAttemptData {
  id: string;
  candidateName: string;
  candidateEmail: string;
  objectiveScore: number;
  totalQuestions: number;
  personalityScores?: Record<string, number>;
  test: {
    id: string;
    title: string;
    description: string | null;
    questions: Array<{
      id: string;
      promptText: string;
      answerOptions: string[];
      questionType: 'OBJECTIVE' | 'PERSONALITY';
      personalityDimension?: PersonalityDimension;
      answerWeights?: Record<string, number>;
      correctAnswerIndex?: number;
    }>;
  };
  answers: Record<string, { answerIndex: number; timeTaken: number }>;
}

export class PDFReportGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private yPosition: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.yPosition = 20;
  }

  private checkNewPage(requiredHeight: number): void {
    if (this.yPosition + requiredHeight > this.pageHeight - 20) {
      this.pdf.addPage();
      this.yPosition = 20;
    }
  }

  private addSectionHeader(title: string, color: string = '#2563eb'): void {
    this.checkNewPage(25);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(color);
    this.pdf.text(title, 20, this.yPosition);
    this.yPosition += 8;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(20, this.yPosition, this.pageWidth - 20, this.yPosition);
    this.yPosition += 15;
  }

  private addParagraph(text: string, fontSize: number = 12): void {
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor('#374151');
    const lines = this.pdf.splitTextToSize(text, this.pageWidth - 40);
    lines.forEach((line: string) => {
      this.checkNewPage(7);
      this.pdf.text(line, 20, this.yPosition);
      this.yPosition += 7;
    });
    this.yPosition += 6;
  }

  private drawRadarChart(
    personalityData: Array<{ dimension: string; score: number }>
  ): void {
    this.checkNewPage(80);

    const centerX = this.pageWidth / 2;
    const centerY = this.yPosition + 40;
    const radius = 30;
    const angles = personalityData.map(
      (_, index) => (index * 2 * Math.PI) / personalityData.length - Math.PI / 2
    );

    // Draw grid circles
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.5);
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      this.pdf.circle(centerX, centerY, r, 'S');
    }

    // Draw axes
    personalityData.forEach((item, index) => {
      const angle = angles[index];
      const endX = centerX + Math.cos(angle) * radius;
      const endY = centerY + Math.sin(angle) * radius;
      this.pdf.line(centerX, centerY, endX, endY);

      // Add labels
      const labelX = centerX + Math.cos(angle) * (radius + 10);
      const labelY = centerY + Math.sin(angle) * (radius + 10);
      this.pdf.setFontSize(8);
      this.pdf.setTextColor('#374151');
      const labelText =
        item.dimension.length > 12
          ? item.dimension.substring(0, 12) + '...'
          : item.dimension;
      this.pdf.text(labelText, labelX - 5, labelY);
    });

    // Draw data polygon
    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setFillColor(59, 130, 246, 0.3);
    this.pdf.setLineWidth(2);

    const dataPoints = personalityData.map((item, index) => {
      const angle = angles[index];
      const dataRadius = (radius * item.score) / 5;
      return {
        x: centerX + Math.cos(angle) * dataRadius,
        y: centerY + Math.sin(angle) * dataRadius,
      };
    });

    // Draw the polygon lines
    if (dataPoints.length > 0) {
      dataPoints.forEach((point, index) => {
        const nextPoint = dataPoints[(index + 1) % dataPoints.length];
        this.pdf.line(point.x, point.y, nextPoint.x, nextPoint.y);
      });
    }

    // Add data points
    dataPoints.forEach((point) => {
      this.pdf.setFillColor(59, 130, 246);
      this.pdf.circle(point.x, point.y, 1, 'F');
    });

    this.yPosition += 80;
  }

  private getScoreInterpretation(score: number): string {
    if (score >= 4.5) return 'Very High';
    if (score >= 3.5) return 'High';
    if (score >= 2.5) return 'Moderate';
    if (score >= 1.5) return 'Low';
    return 'Very Low';
  }

  public async generateReport(testAttempt: TestAttemptData): Promise<void> {
    // Title and Header
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#1f2937');
    this.pdf.text('Comprehensive Assessment Report', 20, this.yPosition);
    this.yPosition += 15;

    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor('#6b7280');
    this.pdf.text(
      `Candidate: ${testAttempt.candidateName}`,
      20,
      this.yPosition
    );
    this.yPosition += 8;
    this.pdf.text(`Test: ${testAttempt.test.title}`, 20, this.yPosition);
    this.yPosition += 8;
    this.pdf.text(
      `Date: ${new Date().toLocaleDateString()}`,
      20,
      this.yPosition
    );
    this.yPosition += 20;

    // Get personality data
    const personalityData = this.getPersonalityData(testAttempt);
    const cognitivePercentage =
      (testAttempt.objectiveScore / testAttempt.totalQuestions) * 100;

    // Executive Summary
    this.addSectionHeader('Executive Summary');

    const topPersonalityTraits = personalityData
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p) => p.dimension);

    let executiveSummary = `${testAttempt.candidateName} completed the assessment with a cognitive performance of ${cognitivePercentage.toFixed(1)}% accuracy (${testAttempt.objectiveScore}/${testAttempt.totalQuestions} correct).`;

    if (personalityData.length > 0) {
      executiveSummary += ` Key personality strengths include ${topPersonalityTraits.join(', ')}, indicating strong potential for roles requiring these characteristics.`;
    }

    // Role fit assessment
    let roleFitAssessment = '';
    if (cognitivePercentage >= 80) {
      roleFitAssessment =
        'Excellent cognitive abilities make this candidate well-suited for analytical and problem-solving roles.';
    } else if (cognitivePercentage >= 60) {
      roleFitAssessment =
        'Good cognitive performance suggests suitability for most standard professional roles.';
    } else {
      roleFitAssessment =
        'May benefit from additional training or support in analytical tasks.';
    }

    if (personalityData.length > 0 && topPersonalityTraits.length > 0) {
      roleFitAssessment += ` The personality profile, particularly strong ${topPersonalityTraits[0]} characteristics, complements the cognitive abilities for comprehensive role performance.`;
    }

    this.addParagraph(executiveSummary);
    this.addParagraph(roleFitAssessment);

    // Cognitive Performance Section
    this.addSectionHeader('Cognitive Performance Analysis', '#059669');

    this.checkNewPage(30);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#374151');
    this.pdf.text('Performance Metrics:', 20, this.yPosition);
    this.yPosition += 10;

    // Cognitive metrics
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const cognitiveMetrics = [
      [
        'Correct Answers',
        `${testAttempt.objectiveScore}/${testAttempt.totalQuestions}`,
      ],
      ['Accuracy Rate', `${cognitivePercentage.toFixed(1)}%`],
      [
        'Performance Level',
        cognitivePercentage >= 80
          ? 'Excellent'
          : cognitivePercentage >= 60
            ? 'Good'
            : 'Needs Improvement',
      ],
    ];

    cognitiveMetrics.forEach(([label, value]) => {
      this.checkNewPage(8);
      this.pdf.text(`• ${label}: ${value}`, 30, this.yPosition);
      this.yPosition += 8;
    });
    this.yPosition += 10;

    // Personality Assessment Section
    if (personalityData.length > 0) {
      this.addSectionHeader('Personality Assessment', '#7c3aed');

      // Overall personality profile summary
      const highScores = personalityData.filter((p) => p.score >= 4.0);
      const moderateScores = personalityData.filter(
        (p) => p.score >= 2.5 && p.score < 4.0
      );
      const lowScores = personalityData.filter((p) => p.score < 2.5);

      let personalitySummary = `The personality assessment reveals a comprehensive profile across ${personalityData.length} dimensions. `;

      if (highScores.length > 0) {
        personalitySummary += `The candidate demonstrates particularly strong characteristics in ${highScores.map((p) => p.dimension).join(', ')}, indicating well-developed capabilities in these areas. `;
      }

      if (moderateScores.length > 0) {
        personalitySummary += `Moderate levels are observed in ${moderateScores.map((p) => p.dimension).join(', ')}, suggesting balanced development. `;
      }

      if (lowScores.length > 0) {
        personalitySummary += `Areas for potential development include ${lowScores.map((p) => p.dimension).join(', ')}.`;
      }

      this.addParagraph(personalitySummary);

      // Score table
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor('#374151');
      this.checkNewPage(15);
      this.pdf.text('Personality Dimension Scores:', 20, this.yPosition);
      this.yPosition += 10;

      personalityData.forEach((item) => {
        this.checkNewPage(8);
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'normal');
        const interpretation = this.getScoreInterpretation(item.score);
        this.pdf.text(
          `• ${item.dimension}: ${item.score.toFixed(1)}/5.0 (${interpretation})`,
          30,
          this.yPosition
        );
        this.yPosition += 8;
      });
      this.yPosition += 10;

      // Radar chart visualization
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.checkNewPage(15);
      this.pdf.text('Personality Profile Visualization:', 20, this.yPosition);
      this.yPosition += 10;
      this.drawRadarChart(personalityData);

      // Behavioral indicators for top 3 dimensions
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.checkNewPage(15);
      this.pdf.text(
        'Top 3 Personality Dimensions - Behavioral Indicators:',
        20,
        this.yPosition
      );
      this.yPosition += 10;

      const top3Dimensions = personalityData
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      top3Dimensions.forEach((item, index) => {
        this.checkNewPage(20);
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(
          `${index + 1}. ${item.dimension} (${item.score.toFixed(1)}/5.0)`,
          30,
          this.yPosition
        );
        this.yPosition += 8;

        this.pdf.setFont('helvetica', 'normal');
        let behavioralText = '';
        if (item.score >= 4.0) {
          behavioralText = `Strong ${item.dimension.toLowerCase()} characteristics suggest excellent performance in related tasks and behaviors. This individual likely demonstrates consistent, high-level capabilities in this area.`;
        } else if (item.score >= 3.0) {
          behavioralText = `Good ${item.dimension.toLowerCase()} levels indicate reliable performance with room for further development. This represents a solid foundation for growth.`;
        } else {
          behavioralText = `Moderate ${item.dimension.toLowerCase()} levels suggest potential for development through targeted training and experience.`;
        }

        const behavioralLines = this.pdf.splitTextToSize(
          behavioralText,
          this.pageWidth - 70
        );
        behavioralLines.forEach((line: string) => {
          this.checkNewPage(6);
          this.pdf.text(line, 40, this.yPosition);
          this.yPosition += 6;
        });
        this.yPosition += 10;
      });

      // Integrated Analysis Section
      this.addSectionHeader('Integrated Analysis', '#dc2626');

      // Performance impact analysis
      this.checkNewPage(20);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Performance Impact Analysis:', 20, this.yPosition);
      this.yPosition += 10;

      const strongTraits = personalityData.filter((p) => p.score >= 4.0);
      let performanceImpact = '';

      if (strongTraits.length > 0 && cognitivePercentage >= 70) {
        performanceImpact = `The combination of strong cognitive performance (${cognitivePercentage.toFixed(1)}%) and high ${strongTraits.map((p) => p.dimension).join(', ')} characteristics creates a powerful foundation for success. This profile suggests excellent potential for complex, demanding roles.`;
      } else if (strongTraits.length > 0) {
        performanceImpact = `While cognitive performance shows room for improvement, strong personality traits in ${strongTraits.map((p) => p.dimension).join(', ')} can compensate and provide alternative pathways to success through interpersonal and behavioral excellence.`;
      } else if (cognitivePercentage >= 70) {
        performanceImpact = `Strong cognitive abilities provide a solid foundation for performance, though developing stronger personality characteristics could enhance overall effectiveness and leadership potential.`;
      } else {
        performanceImpact = `Both cognitive and personality development opportunities exist, suggesting a comprehensive development plan would be most beneficial for optimal performance growth.`;
      }

      this.addParagraph(performanceImpact);

      // Team collaboration insights
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.checkNewPage(15);
      this.pdf.text('Team Collaboration Insights:', 20, this.yPosition);
      this.yPosition += 10;

      const collaborationTraits = personalityData.filter(
        (p) =>
          p.dimension.toLowerCase().includes('team') ||
          p.dimension.toLowerCase().includes('communication') ||
          p.dimension.toLowerCase().includes('social') ||
          p.dimension.toLowerCase().includes('empathy')
      );

      let collaborationInsight = '';
      if (collaborationTraits.length > 0) {
        const avgCollabScore =
          collaborationTraits.reduce((sum, trait) => sum + trait.score, 0) /
          collaborationTraits.length;
        if (avgCollabScore >= 3.5) {
          collaborationInsight = `Strong collaboration-related traits suggest this individual will work effectively in team environments, contributing positively to group dynamics and communication.`;
        } else {
          collaborationInsight = `Moderate collaboration traits indicate potential for team participation with possible need for support in group dynamics and communication skills.`;
        }
      } else {
        collaborationInsight = `Team collaboration potential should be assessed through additional behavioral observations and team-based exercises.`;
      }

      this.addParagraph(collaborationInsight);

      // Development recommendations
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.checkNewPage(15);
      this.pdf.text('Development Recommendations:', 20, this.yPosition);
      this.yPosition += 10;

      const developmentAreas = personalityData.filter((p) => p.score < 3.0);
      let recommendations = '';

      if (cognitivePercentage < 70) {
        recommendations +=
          '• Cognitive Skills: Consider structured training programs in analytical thinking and problem-solving techniques.\n';
      }

      if (developmentAreas.length > 0) {
        recommendations += `• Personality Development: Focus on strengthening ${developmentAreas.map((p) => p.dimension).join(', ')} through targeted coaching and practice.\n`;
      }

      recommendations +=
        '• Regular feedback and performance reviews to track progress and adjust development plans.\n';
      recommendations +=
        '• Mentoring opportunities to accelerate growth in key areas.\n';

      if (strongTraits.length > 0) {
        recommendations += `• Leverage existing strengths in ${strongTraits.map((p) => p.dimension).join(', ')} to build confidence and support weaker areas.`;
      }

      this.addParagraph(recommendations);
    }

    // Save the PDF
    const fileName = `Assessment_Report_${testAttempt.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(fileName);
  }

  public async generateQAReport(
    testAttempt: TestAttemptData
  ): Promise<Uint8Array> {
    // Reset PDF for new report
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.yPosition = 20;

    // Title and Header
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#1a1a1a');
    this.pdf.text('Test Results Summary', 20, this.yPosition);
    this.yPosition += 15;

    // Candidate Info
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor('#666666');
    this.pdf.text(
      `Candidate: ${testAttempt.candidateName}`,
      20,
      this.yPosition
    );
    this.yPosition += 6;
    this.pdf.text(`Email: ${testAttempt.candidateEmail}`, 20, this.yPosition);
    this.yPosition += 6;
    this.pdf.text(`Test: ${testAttempt.test.title}`, 20, this.yPosition);
    this.yPosition += 6;
    this.pdf.text(
      `Date: ${new Date().toLocaleDateString()}`,
      20,
      this.yPosition
    );
    this.yPosition += 20;

    // Score Summary
    const cognitivePercentage =
      (testAttempt.objectiveScore / testAttempt.totalQuestions) * 100;
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#2e7d32');
    this.pdf.text(
      `Overall Score: ${testAttempt.objectiveScore}/${testAttempt.totalQuestions} (${cognitivePercentage.toFixed(1)}%)`,
      20,
      this.yPosition
    );
    this.yPosition += 20;

    // Questions and Answers Section
    this.addSectionHeader('Questions & Answers', '#2563eb');

    const objectiveQuestions = testAttempt.test.questions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );

    objectiveQuestions.forEach((question, index) => {
      this.checkNewPage(35); // Ensure enough space for question block

      // Question number and text
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor('#1a1a1a');
      this.pdf.text(`Question ${index + 1}:`, 20, this.yPosition);
      this.yPosition += 7;

      // Question text (wrapped)
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor('#333333');
      const questionLines = this.pdf.splitTextToSize(
        question.promptText,
        this.pageWidth - 50
      );
      questionLines.forEach((line: string) => {
        this.pdf.text(line, 25, this.yPosition);
        this.yPosition += 5;
      });
      this.yPosition += 6;

      // Answer options with indicators
      const userAnswer = testAttempt.answers[question.id];
      const userAnswerIndex = userAnswer?.answerIndex;
      const correctIndex = question.correctAnswerIndex;

      question.answerOptions.forEach((option, optionIndex) => {
        this.checkNewPage(6);
        const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D
        let prefix = `${letter}) `;
        let color = '#666666'; // Default gray

        // Mark user's answer and correct answer
        if (optionIndex === userAnswerIndex && optionIndex === correctIndex) {
          prefix = `${letter}) ✓ `;
          color = '#2e7d32'; // Green for correct answer
          this.pdf.setFont('helvetica', 'bold');
        } else if (optionIndex === userAnswerIndex) {
          prefix = `${letter}) ✗ `;
          color = '#d32f2f'; // Red for wrong answer
          this.pdf.setFont('helvetica', 'bold');
        } else if (optionIndex === correctIndex) {
          prefix = `${letter}) ✓ `;
          color = '#2e7d32'; // Green for correct answer
          this.pdf.setFont('helvetica', 'normal');
        } else {
          this.pdf.setFont('helvetica', 'normal');
        }

        this.pdf.setFontSize(10);
        this.pdf.setTextColor(color);

        // Split long option text if needed
        const optionText = prefix + option;
        const optionLines = this.pdf.splitTextToSize(
          optionText,
          this.pageWidth - 80
        );
        optionLines.forEach((line: string) => {
          this.checkNewPage(4);
          this.pdf.text(line, 30, this.yPosition);
          this.yPosition += 4;
        });
        this.yPosition += 2;
      });

      // Add spacing between questions
      this.yPosition += 12;
    });

    // Generate and return PDF as Uint8Array
    return new Uint8Array(this.pdf.output('arraybuffer'));
  }

  public async generateBulkQAReport(
    testAttempts: TestAttemptData[],
    positionName?: string
  ): Promise<Uint8Array> {
    // Reset PDF for new report
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.yPosition = 20;

    // Title and Header
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#1a1a1a');
    const title = positionName
      ? `Test Comparison - ${positionName}`
      : 'Bulk Test Comparison';
    this.pdf.text(title, 20, this.yPosition);
    this.yPosition += 15;

    // Summary
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor('#666666');
    this.pdf.text(
      `Total Candidates: ${testAttempts.length}`,
      20,
      this.yPosition
    );
    this.yPosition += 6;
    this.pdf.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      20,
      this.yPosition
    );
    this.yPosition += 20;

    // Legend Section
    this.addSectionHeader('How to Read This Report', '#d32f2f');

    // Create a clean legend box
    this.pdf.setFillColor(252, 252, 252);
    this.pdf.rect(20, this.yPosition - 2, this.pageWidth - 40, 25, 'F');
    this.pdf.setDrawColor('#e0e0e0');
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(20, this.yPosition - 2, this.pageWidth - 40, 25, 'S');

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor('#444444');

    this.pdf.text(
      '• Correct answers are highlighted with blue backgrounds and marked with ✓ CORRECT',
      25,
      this.yPosition + 4
    );
    this.pdf.text(
      '• Candidate names are displayed in a clean grid format under each option',
      25,
      this.yPosition + 8
    );
    this.pdf.text(
      '• Green text indicates candidates who selected the correct answer',
      25,
      this.yPosition + 12
    );
    this.pdf.text(
      '• Red text indicates candidates who selected incorrect answers',
      25,
      this.yPosition + 16
    );
    this.pdf.text(
      '• Success rates are shown both in question headers and summary sections',
      25,
      this.yPosition + 20
    );

    this.yPosition += 35;

    // Candidates Summary
    this.addSectionHeader('Candidate Scores', '#1976d2');

    // Create table header
    this.pdf.setFillColor(240, 248, 255);
    this.pdf.rect(20, this.yPosition - 2, this.pageWidth - 40, 8, 'F');
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor('#1976d2');
    this.pdf.text('Rank', 25, this.yPosition + 3);
    this.pdf.text('Candidate Name', 45, this.yPosition + 3);
    this.pdf.text('Score', this.pageWidth - 80, this.yPosition + 3);
    this.pdf.text('Percentage', this.pageWidth - 45, this.yPosition + 3);
    this.yPosition += 12;

    // Sort candidates by score for ranking
    const sortedAttempts = [...testAttempts].sort(
      (a, b) => b.objectiveScore - a.objectiveScore
    );

    sortedAttempts.forEach((attempt, index) => {
      this.checkNewPage(6);
      const cognitivePercentage =
        (attempt.objectiveScore / attempt.totalQuestions) * 100;

      // Alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(248, 250, 252);
        this.pdf.rect(20, this.yPosition - 1, this.pageWidth - 40, 5, 'F');
      }

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor('#333333');

      // Rank
      this.pdf.text(`${index + 1}`, 27, this.yPosition + 2);

      // Candidate name (truncate if too long)
      let candidateName = attempt.candidateName;
      if (candidateName.length > 25) {
        candidateName = candidateName.substring(0, 22) + '...';
      }
      this.pdf.text(candidateName, 45, this.yPosition + 2);

      // Score
      this.pdf.text(
        `${attempt.objectiveScore}/${attempt.totalQuestions}`,
        this.pageWidth - 78,
        this.yPosition + 2
      );

      // Percentage with color coding
      if (cognitivePercentage >= 80) {
        this.pdf.setTextColor('#2e7d32');
      } else if (cognitivePercentage >= 60) {
        this.pdf.setTextColor('#f57c00');
      } else {
        this.pdf.setTextColor('#d32f2f');
      }
      this.pdf.text(
        `${cognitivePercentage.toFixed(1)}%`,
        this.pageWidth - 40,
        this.yPosition + 2
      );

      this.yPosition += 5;
    });
    this.yPosition += 20;

    // Get questions from the first test (assuming all have same questions)
    if (testAttempts.length === 0) {
      return new Uint8Array(this.pdf.output('arraybuffer'));
    }

    const objectiveQuestions = testAttempts[0].test.questions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );

    // Question-by-Question Analysis
    this.addSectionHeader('Question-by-Question Analysis', '#1976d2');

    objectiveQuestions.forEach((question, qIndex) => {
      this.checkNewPage(60); // Ensure enough space for question block

      // Group candidates by their answers first
      const answerGroups: Record<number, string[]> = {};
      testAttempts.forEach((attempt) => {
        const userAnswer = attempt.answers[question.id];
        if (userAnswer?.answerIndex !== undefined) {
          const answerIndex = userAnswer.answerIndex;
          if (!answerGroups[answerIndex]) {
            answerGroups[answerIndex] = [];
          }
          answerGroups[answerIndex].push(attempt.candidateName);
        }
      });

      // Question Header Box
      this.pdf.setFillColor(248, 250, 252); // Light gray background
      this.pdf.rect(20, this.yPosition - 2, this.pageWidth - 40, 15, 'F');

      // Question number
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor('#1976d2');
      this.pdf.text(`Question ${qIndex + 1}`, 25, this.yPosition + 6);

      // Question stats on the right
      const questionTotalAnswered = Object.values(answerGroups).reduce(
        (sum, candidates) => sum + candidates.length,
        0
      );
      const questionCorrectCount =
        answerGroups[question.correctAnswerIndex!]?.length || 0;
      const questionAccuracy =
        questionTotalAnswered > 0
          ? ((questionCorrectCount / questionTotalAnswered) * 100).toFixed(0)
          : '0';

      this.pdf.setFontSize(9);
      this.pdf.setTextColor('#666666');
      this.pdf.text(
        `${questionAccuracy}% correct`,
        this.pageWidth - 45,
        this.yPosition + 6
      );

      this.yPosition += 18;

      // Question text (properly wrapped)
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor('#333333');
      const questionLines = this.pdf.splitTextToSize(
        question.promptText,
        this.pageWidth - 50
      );
      questionLines.forEach((line: string) => {
        this.checkNewPage(4);
        this.pdf.text(line, 25, this.yPosition);
        this.yPosition += 4;
      });
      this.yPosition += 12;

      // Display each answer option in a clean table format
      question.answerOptions.forEach((option, optionIndex) => {
        this.checkNewPage(20);
        const letter = String.fromCharCode(65 + optionIndex);
        const isCorrect = optionIndex === question.correctAnswerIndex;
        const candidatesWhoSelected = answerGroups[optionIndex] || [];

        // Draw option box background
        if (isCorrect) {
          this.pdf.setFillColor(240, 248, 255); // Light blue background for correct answer
          this.pdf.rect(25, this.yPosition - 3, this.pageWidth - 50, 12, 'F');
        }

        // Option letter and text
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(isCorrect ? '#1976d2' : '#333333');

        // Option letter in a circle/box
        this.pdf.setDrawColor(isCorrect ? '#1976d2' : '#999999');
        this.pdf.setLineWidth(1);
        this.pdf.circle(30, this.yPosition + 2, 3, 'S');
        this.pdf.text(letter, 28.5, this.yPosition + 3.5);

        // Option text
        this.pdf.setTextColor('#333333');
        const optionLines = this.pdf.splitTextToSize(
          option,
          this.pageWidth - 90
        );
        let currentY = this.yPosition + 3;
        optionLines.forEach((line: string) => {
          this.pdf.text(line, 38, currentY);
          currentY += 4;
        });

        // Correct answer indicator
        if (isCorrect) {
          this.pdf.setTextColor('#2e7d32');
          this.pdf.setFont('helvetica', 'bold');
          this.pdf.text('✓ CORRECT', this.pageWidth - 45, this.yPosition + 3);
        }

        this.yPosition = currentY + 2;

        // Show candidates in a clean format
        if (candidatesWhoSelected.length > 0) {
          this.pdf.setFontSize(9);
          this.pdf.setFont('helvetica', 'normal');
          this.pdf.setTextColor(isCorrect ? '#2e7d32' : '#d32f2f');

          // Header for candidate list
          const headerText = isCorrect ? 'Selected by:' : 'Selected by:';
          this.pdf.text(headerText, 40, this.yPosition);
          this.yPosition += 4;

          // Display candidates in a clean grid format
          let currentX = 45;
          let maxY = this.yPosition;
          const nameSpacing = 85; // Fixed width for each name
          const lineHeight = 4;

          candidatesWhoSelected.forEach((name, index) => {
            // Check if we need to move to next line
            if (currentX + nameSpacing > this.pageWidth - 30) {
              currentX = 45;
              maxY += lineHeight;
            }

            this.checkNewPage(4);
            this.pdf.text(`• ${name}`, currentX, maxY);
            currentX += nameSpacing;
          });

          this.yPosition = maxY + 6;
        } else {
          this.pdf.setFontSize(9);
          this.pdf.setFont('helvetica', 'italic');
          this.pdf.setTextColor('#888888');
          this.pdf.text(
            'No candidates selected this option',
            40,
            this.yPosition
          );
          this.yPosition += 6;
        }

        // Add separator line
        this.pdf.setDrawColor('#e0e0e0');
        this.pdf.setLineWidth(0.3);
        this.pdf.line(25, this.yPosition, this.pageWidth - 25, this.yPosition);
        this.yPosition += 8;
      });

      // Final question summary
      this.yPosition += 5;
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor('#666666');
      this.pdf.text(
        `Overall Success Rate: ${questionAccuracy}% (${questionCorrectCount}/${questionTotalAnswered} candidates)`,
        30,
        this.yPosition
      );
      this.yPosition += 25; // Extra space between questions
    });

    // Generate and return PDF as Uint8Array
    return new Uint8Array(this.pdf.output('arraybuffer'));
  }

  private getPersonalityData(
    testAttempt: TestAttemptData
  ): Array<{ dimension: string; score: number }> {
    if (!testAttempt.personalityScores) return [];

    return Object.entries(testAttempt.personalityScores).map(
      ([dimensionCode, score]) => {
        const dimension = testAttempt.test.questions.find(
          (q) => q.personalityDimension?.code === dimensionCode
        )?.personalityDimension;

        return {
          dimension: dimension?.name || dimensionCode,
          score: Number(score),
        };
      }
    );
  }
}

export const generatePDFReport = async (
  testAttempt: TestAttemptData
): Promise<void> => {
  const generator = new PDFReportGenerator();
  await generator.generateReport(testAttempt);
};
