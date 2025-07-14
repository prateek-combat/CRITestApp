// Import puppeteer conditionally for server-side only
const puppeteer = typeof window === 'undefined' ? require('puppeteer') : null;

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
      personalityDimension?: any;
      answerWeights?: Record<string, number>;
      correctAnswerIndex?: number;
    }>;
  };
  answers: Record<string, { answerIndex: number; timeTaken: number }>;
}

export class HtmlPdfReportGenerator {
  private formatCodeInText(text: string): string {
    // Check if the text contains code-like patterns
    const codePatterns = [
      /```[\s\S]*?```/g, // Markdown code blocks
      /`[^`]+`/g, // Inline code
      /#include\s*<[^>]+>/g, // C++ includes
      /\b(std::|int|void|char|float|double|bool|string)\s*\w*/g, // C++ patterns
      /\b(function|const|let|var|class)\s+\w*/g, // JS keywords
      /::/g, // C++ scope resolution
      /->/g, // C++ arrow operator
      /\bmove\s*\(/g, // C++ move function
    ];

    let containsCode = codePatterns.some((pattern) => pattern.test(text));

    if (containsCode) {
      // Handle markdown code blocks first
      text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        // Preserve line breaks and indentation
        const formattedCode = code.trim().replace(/\n/g, '\n');
        return `<div class="code-block">${this.escapeHtml(formattedCode)}</div>`;
      });

      // Handle inline code
      text = text.replace(/`([^`]+)`/g, (match, code) => {
        return `<span class="inline-code">${this.escapeHtml(code)}</span>`;
      });

      // If no explicit markdown but looks like code, format as code block
      if (
        !text.includes('<div class="code-block">') &&
        !text.includes('<span class="inline-code">') &&
        containsCode
      ) {
        // Preserve original line breaks and spacing
        const formattedText = text.replace(/\n/g, '\n');
        return `<div class="code-block">${this.escapeHtml(formattedText)}</div>`;
      }
    }

    // For regular text, convert newlines to HTML breaks
    return this.escapeHtml(text).replace(/\n/g, '<br>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateSingleReportHtml(testAttempt: TestAttemptData): string {
    // Include ALL questions, not just objective ones
    const allQuestions = testAttempt.test.questions;

    // Calculate the total number of objective questions for scoring
    const objectiveQuestions = allQuestions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );

    const cognitivePercentage =
      objectiveQuestions.length > 0
        ? (testAttempt.objectiveScore / objectiveQuestions.length) * 100
        : 0;

    const questionsHtml = allQuestions
      .map((question, index) => {
        const userAnswer = testAttempt.answers[question.id];
        const userAnswerIndex = userAnswer?.answerIndex;
        const correctIndex = question.correctAnswerIndex;
        const wasAnswered =
          userAnswerIndex !== undefined && userAnswerIndex !== -1;

        const optionsHtml = question.answerOptions
          .map((option, optionIndex) => {
            const letter = String.fromCharCode(65 + optionIndex);
            let className = 'option';
            let indicator = '';

            // Only show correct/incorrect for objective questions
            if (question.questionType !== 'PERSONALITY') {
              if (
                wasAnswered &&
                optionIndex === userAnswerIndex &&
                optionIndex === correctIndex
              ) {
                className += ' correct user-answer';
                indicator = '✓';
              } else if (wasAnswered && optionIndex === userAnswerIndex) {
                className += ' incorrect user-answer';
                indicator = '✗';
              } else if (optionIndex === correctIndex) {
                className += ' correct';
                indicator = '✓';
              }
            } else {
              // For personality questions, just highlight selected answer
              if (wasAnswered && optionIndex === userAnswerIndex) {
                className += ' personality-selected';
              }
            }

            const formattedOption = this.formatCodeInText(option);

            return `
          <div class="${className}">
            <span class="option-letter">${letter})</span>
            <span class="option-indicator">${indicator}</span>
            <div class="option-content">${formattedOption}</div>
          </div>
        `;
          })
          .join('');

        const formattedQuestion = this.formatCodeInText(question.promptText);

        const questionTypeLabel =
          question.questionType === 'PERSONALITY'
            ? '<span class="question-type personality">Personality</span>'
            : '<span class="question-type objective">Objective</span>';

        return `
        <div class="question-block ${question.questionType === 'PERSONALITY' ? 'personality-question' : ''}">
          <h3>Question ${index + 1} ${questionTypeLabel} ${!wasAnswered ? '<span class="not-answered">(Not Answered)</span>' : ''}</h3>
          <div class="question-text">${formattedQuestion}</div>
          <div class="options">
            ${optionsHtml}
          </div>
        </div>
      `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Results Summary</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 11pt;
        }

        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .title {
            font-size: 24pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 15px;
        }

        .candidate-info {
            color: #666;
            font-size: 10pt;
            line-height: 1.4;
        }

        .score-summary {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .score-summary .score {
            font-size: 18pt;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 5px;
        }

        .questions-section {
            margin-top: 30px;
        }

        .section-header {
            font-size: 16pt;
            font-weight: bold;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
            margin-bottom: 20px;
        }

        .question-block {
            margin-bottom: 30px;
            page-break-inside: avoid;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
        }

        .question-block h3 {
            color: #1976d2;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .not-answered {
            color: #f57c00;
            font-size: 10pt;
            font-weight: normal;
            font-style: italic;
        }

        .question-text {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid #2563eb;
        }

        .options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .option {
            display: flex;
            align-items: flex-start;
            padding: 10px;
            border-radius: 6px;
            background: white;
            border: 1px solid #e5e7eb;
            position: relative;
        }

        .option.correct {
            background: #f0f9ff;
            border-color: #2563eb;
        }

        .option.incorrect {
            background: #fef2f2;
            border-color: #dc2626;
        }

        .option.user-answer {
            font-weight: bold;
        }

        .option-letter {
            font-weight: bold;
            margin-right: 10px;
            min-width: 20px;
        }

        .option-indicator {
            font-weight: bold;
            margin-right: 10px;
            min-width: 15px;
        }

        .option.correct .option-indicator {
            color: #2e7d32;
        }

        .option.incorrect .option-indicator {
            color: #d32f2f;
        }

        .option.personality-selected {
            background: #f5f0ff;
            border-color: #7b1fa2;
            font-weight: bold;
        }

        .option-content {
            flex: 1;
        }

        .question-type {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: normal;
            margin-left: 10px;
        }

        .question-type.objective {
            background: #e3f2fd;
            color: #1976d2;
        }

        .question-type.personality {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .personality-question {
            border-left-color: #7b1fa2 !important;
        }

        .personality-question .question-text {
            border-left-color: #7b1fa2 !important;
        }

        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Courier New', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 9pt;
            line-height: 1.5;
            color: #212529;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .inline-code {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
            padding: 2px 4px;
            font-family: 'Courier New', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 9pt;
            color: #495057;
        }

        @media print {
            body { margin: 0; }
            .question-block { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Test Results Summary</div>
        <div class="candidate-info">
            <div><strong>Candidate:</strong> ${testAttempt.candidateName}</div>
            <div><strong>Email:</strong> ${testAttempt.candidateEmail}</div>
            <div><strong>Test:</strong> ${testAttempt.test.title}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    <div class="score-summary">
        <div class="score">Overall Score: ${testAttempt.objectiveScore}/${testAttempt.totalQuestions} (${cognitivePercentage.toFixed(1)}%)</div>
    </div>

    <div class="questions-section">
        <div class="section-header">Questions & Answers</div>
        ${questionsHtml}
    </div>
</body>
</html>
    `;
  }

  private generateBulkReportHtml(
    testAttempts: TestAttemptData[],
    positionName?: string
  ): string {
    const title = positionName
      ? `Test Comparison - ${positionName}`
      : 'Bulk Test Comparison';

    // Sort candidates by score for ranking
    const sortedAttempts = [...testAttempts].sort(
      (a, b) => b.objectiveScore - a.objectiveScore
    );

    const candidateScoresHtml = sortedAttempts
      .map((attempt, index) => {
        const cognitivePercentage =
          (attempt.objectiveScore / attempt.totalQuestions) * 100;
        let scoreClass = 'score-average';
        if (cognitivePercentage >= 80) scoreClass = 'score-excellent';
        else if (cognitivePercentage >= 60) scoreClass = 'score-good';
        else scoreClass = 'score-poor';

        return `
        <tr>
          <td>${index + 1}</td>
          <td>${attempt.candidateName}</td>
          <td>${attempt.objectiveScore}/${attempt.totalQuestions}</td>
          <td class="${scoreClass}">${cognitivePercentage.toFixed(1)}%</td>
        </tr>
      `;
      })
      .join('');

    // Get ALL questions from the first test (assuming all have same questions)
    const allQuestions = testAttempts[0]?.test.questions || [];

    const questionsAnalysisHtml = allQuestions
      .map((question, qIndex) => {
        const isPersonality = question.questionType === 'PERSONALITY';

        // Group candidates by their answers
        const answerGroups: Record<number, string[]> = {};
        testAttempts.forEach((attempt) => {
          const userAnswer = attempt.answers[question.id];
          // Only count answered questions (answerIndex !== -1)
          if (
            userAnswer?.answerIndex !== undefined &&
            userAnswer.answerIndex !== -1
          ) {
            const answerIndex = userAnswer.answerIndex;
            if (!answerGroups[answerIndex]) {
              answerGroups[answerIndex] = [];
            }
            answerGroups[answerIndex].push(attempt.candidateName);
          }
        });

        const questionTotalAnswered = Object.values(answerGroups).reduce(
          (sum, candidates) => sum + candidates.length,
          0
        );

        let successRateHtml = '';
        if (!isPersonality) {
          const questionCorrectCount =
            answerGroups[question.correctAnswerIndex!]?.length || 0;
          const questionAccuracy =
            questionTotalAnswered > 0
              ? ((questionCorrectCount / questionTotalAnswered) * 100).toFixed(
                  0
                )
              : '0';
          successRateHtml = `<span class="success-rate">${questionAccuracy}% correct (${questionCorrectCount}/${questionTotalAnswered} candidates)</span>`;
        } else {
          successRateHtml = `<span class="success-rate personality-rate">Personality Question (${questionTotalAnswered} responded)</span>`;
        }

        const optionsHtml = question.answerOptions
          .map((option, optionIndex) => {
            const isCorrect =
              !isPersonality && optionIndex === question.correctAnswerIndex;
            const candidatesWhoSelected = answerGroups[optionIndex] || [];
            const letter = String.fromCharCode(65 + optionIndex);

            const formattedOption = this.formatCodeInText(option);

            let candidatesHtml = '';
            if (candidatesWhoSelected.length > 0) {
              if (!isPersonality) {
                candidatesHtml = candidatesWhoSelected
                  .map(
                    (name) =>
                      `<span class="candidate-name ${isCorrect ? 'correct' : 'incorrect'}">${name}</span>`
                  )
                  .join('');
              } else {
                candidatesHtml = candidatesWhoSelected
                  .map(
                    (name) =>
                      `<span class="candidate-name personality-response">${name}</span>`
                  )
                  .join('');
              }
            } else {
              candidatesHtml =
                '<span class="no-selection">No candidates selected this option</span>';
            }

            return `
          <div class="answer-option ${isCorrect ? 'correct-option' : ''} ${isPersonality ? 'personality-option' : ''}">
            <div class="option-header">
              <span class="option-letter">${letter})</span>
              ${isCorrect ? '<span class="correct-indicator">✓ CORRECT</span>' : ''}
            </div>
            <div class="option-text">${formattedOption}</div>
            <div class="candidates-list">
              <strong>Selected by:</strong> ${candidatesHtml}
            </div>
          </div>
        `;
          })
          .join('');

        const formattedQuestion = this.formatCodeInText(question.promptText);
        const questionTypeLabel = isPersonality
          ? '<span class="question-type personality">Personality</span>'
          : '<span class="question-type objective">Objective</span>';

        return `
        <div class="question-analysis ${isPersonality ? 'personality-analysis' : ''}">
          <div class="question-header">
            <h3>Question ${qIndex + 1} ${questionTypeLabel}</h3>
            ${successRateHtml}
          </div>
          <div class="question-content">${formattedQuestion}</div>
          <div class="answer-options">
            ${optionsHtml}
          </div>
        </div>
      `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 10pt;
        }

        .header {
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .title {
            font-size: 22pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
        }

        .summary-info {
            color: #666;
            font-size: 9pt;
        }

        .legend {
            background: #fcfcfc;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }

        .legend h4 {
            color: #d32f2f;
            margin-bottom: 10px;
        }

        .legend ul {
            list-style: none;
            font-size: 9pt;
            color: #444;
        }

        .legend li {
            margin-bottom: 3px;
        }

        .scores-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }

        .scores-table th {
            background: #f0f8ff;
            color: #1976d2;
            font-weight: bold;
            padding: 8px;
            border: 1px solid #e0e0e0;
            font-size: 9pt;
        }

        .scores-table td {
            padding: 6px 8px;
            border: 1px solid #e0e0e0;
            font-size: 9pt;
        }

        .scores-table tr:nth-child(even) {
            background: #f8fafc;
        }

        .score-excellent { color: #2e7d32; font-weight: bold; }
        .score-good { color: #f57c00; font-weight: bold; }
        .score-poor { color: #d32f2f; font-weight: bold; }

        .section-header {
            font-size: 14pt;
            font-weight: bold;
            color: #1976d2;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 5px;
            margin: 30px 0 20px 0;
        }

        .question-analysis {
            margin-bottom: 40px;
            page-break-inside: avoid;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: #f8fafc;
            border-radius: 6px;
        }

        .question-header h3 {
            color: #1976d2;
            font-size: 11pt;
        }

        .success-rate {
            font-size: 9pt;
            color: #666;
            font-weight: bold;
        }

        .question-content {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid #1976d2;
        }

        .answer-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .answer-option {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
        }

        .answer-option.correct-option {
            background: #f0f8ff;
            border-color: #1976d2;
        }

        .option-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .option-letter {
            font-weight: bold;
            font-size: 10pt;
        }

        .correct-indicator {
            color: #2e7d32;
            font-weight: bold;
            font-size: 9pt;
        }

        .option-text {
            margin-bottom: 10px;
            padding-left: 20px;
        }

        .candidates-list {
            padding-left: 20px;
            font-size: 9pt;
        }

        .candidate-name {
            display: inline-block;
            margin: 2px 4px;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8pt;
        }

        .candidate-name.correct {
            background: #e8f5e8;
            color: #2e7d32;
        }

        .candidate-name.incorrect {
            background: #ffeaea;
            color: #d32f2f;
        }

        .candidate-name.personality-response {
            background: #f5f0ff;
            color: #7b1fa2;
        }

        .no-selection {
            color: #888;
            font-style: italic;
            font-size: 8pt;
        }

        .question-type {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: normal;
            margin-left: 8px;
        }

        .question-type.objective {
            background: #e3f2fd;
            color: #1976d2;
        }

        .question-type.personality {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .personality-analysis .question-content {
            border-left-color: #7b1fa2 !important;
        }

        .personality-option {
            background: #fcf9ff;
        }

        .personality-rate {
            color: #7b1fa2 !important;
        }

        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
            overflow-x: auto;
            font-family: 'Courier New', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 8pt;
            line-height: 1.5;
            color: #212529;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .inline-code {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
            padding: 1px 3px;
            font-family: 'Courier New', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 8pt;
            color: #495057;
        }

        @media print {
            body { margin: 0; }
            .question-analysis { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${title}</div>
        <div class="summary-info">
            <div><strong>Total Candidates:</strong> ${testAttempts.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    <div class="legend">
        <h4>How to Read This Report</h4>
        <ul>
            <li>• Correct answers are highlighted with blue backgrounds and marked with ✓ CORRECT</li>
            <li>• Candidate names are displayed under each answer option they selected</li>
            <li>• Green names indicate candidates who selected the correct answer</li>
            <li>• Red names indicate candidates who selected incorrect answers</li>
            <li>• Success rates are shown in question headers and summary sections</li>
            <li>• Code questions are properly formatted with syntax highlighting</li>
        </ul>
    </div>

    <div class="section-header">Candidate Scores</div>
    <table class="scores-table">
        <thead>
            <tr>
                <th>Rank</th>
                <th>Candidate Name</th>
                <th>Score</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            ${candidateScoresHtml}
        </tbody>
    </table>

    <div class="section-header">Question-by-Question Analysis</div>
    ${questionsAnalysisHtml}
</body>
</html>
    `;
  }

  public async generateQAReport(
    testAttempt: TestAttemptData
  ): Promise<Uint8Array> {
    const html = this.generateSingleReportHtml(testAttempt);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return new Uint8Array(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  public async generateBulkQAReport(
    testAttempts: TestAttemptData[],
    positionName?: string
  ): Promise<Uint8Array> {
    const html = this.generateBulkReportHtml(testAttempts, positionName);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm',
        },
        printBackground: true,
      });

      return new Uint8Array(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
