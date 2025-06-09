import { NextRequest, NextResponse } from 'next/server';
import { QuestionCategory } from '@prisma/client';
import * as XLSX from 'xlsx-js-style';

// Define the updated template headers including personality question support
const TEMPLATE_HEADERS = [
  'promptText',
  'questionType',
  'category',
  'timerSeconds',
  'correctAnswerIndex',
  'Answer A',
  'Answer B',
  'Answer C',
  'Answer D',
  'Answer E',
  'Answer F',
  'answerWeights',
  'personalityDimensionCode',
  'promptImageUrl',
  'sectionTag',
];

// Common section tags for dropdown
const COMMON_SECTIONS = [
  'Basic Math',
  'Algebra',
  'Geometry',
  'Statistics',
  'Vocabulary',
  'Reading Comprehension',
  'Grammar',
  'Spelling',
  'Logic Puzzles',
  'Pattern Recognition',
  'Sequences',
  'Spatial Reasoning',
  'Visual Perception',
  'Attention to Detail',
  'Memory',
  'General Knowledge',
  'Science',
  'History',
  'Geography',
  'Personality Assessment',
  'Big Five',
  'DISC',
  'Myers-Briggs',
  'Emotional Intelligence',
];

// Common personality dimensions (these should match your database)
const COMMON_PERSONALITY_DIMENSIONS = [
  'EXT', // Extraversion
  'AGR', // Agreeableness
  'CON', // Conscientiousness
  'NEU', // Neuroticism
  'OPE', // Openness
  'DOM', // Dominance
  'INF', // Influence
  'STE', // Steadiness
  'COM', // Compliance
  'EI', // Emotional Intelligence
  'STR', // Stress Tolerance
  'ADA', // Adaptability
  'LEA', // Leadership
  'TEA', // Teamwork
  'COM', // Communication
];

// Updated sample data including personality questions
const SAMPLE_QUESTIONS = [
  {
    promptText: 'What is 2 + 2?',
    questionType: 'OBJECTIVE',
    category: 'NUMERICAL',
    timerSeconds: '15',
    correctAnswerIndex: 'B',
    'Answer A': '3',
    'Answer B': '4',
    'Answer C': '5',
    'Answer D': '6',
    'Answer E': '',
    'Answer F': '',
    answerWeights: '',
    personalityDimensionCode: '',
    promptImageUrl: '',
    sectionTag: 'Basic Math',
  },
  {
    promptText: 'Choose the synonym for "Happy"',
    questionType: 'OBJECTIVE',
    category: 'VERBAL',
    timerSeconds: '20',
    correctAnswerIndex: 'A',
    'Answer A': 'Joyful',
    'Answer B': 'Sad',
    'Answer C': 'Angry',
    'Answer D': '',
    'Answer E': '',
    'Answer F': '',
    answerWeights: '',
    personalityDimensionCode: '',
    promptImageUrl: '',
    sectionTag: 'Vocabulary',
  },
  {
    promptText: 'What comes next in the sequence: 2, 4, 8, 16, ?',
    questionType: 'OBJECTIVE',
    category: 'LOGICAL',
    timerSeconds: '30',
    correctAnswerIndex: 'C',
    'Answer A': '24',
    'Answer B': '30',
    'Answer C': '32',
    'Answer D': '36',
    'Answer E': '',
    'Answer F': '',
    answerWeights: '',
    personalityDimensionCode: '',
    promptImageUrl: '',
    sectionTag: 'Pattern Recognition',
  },
  {
    promptText: 'I enjoy being the center of attention at social gatherings',
    questionType: 'PERSONALITY',
    category: 'VERBAL',
    timerSeconds: '30',
    correctAnswerIndex: '',
    'Answer A': 'Strongly Disagree',
    'Answer B': 'Disagree',
    'Answer C': 'Neutral',
    'Answer D': 'Agree',
    'Answer E': 'Strongly Agree',
    'Answer F': '',
    answerWeights: '[1, 2, 3, 4, 5]',
    personalityDimensionCode: 'EXT',
    promptImageUrl: '',
    sectionTag: 'Big Five',
  },
  {
    promptText:
      'I prefer to work in a structured environment with clear deadlines',
    questionType: 'PERSONALITY',
    category: 'VERBAL',
    timerSeconds: '30',
    correctAnswerIndex: '',
    'Answer A': 'Strongly Disagree',
    'Answer B': 'Disagree',
    'Answer C': 'Neutral',
    'Answer D': 'Agree',
    'Answer E': 'Strongly Agree',
    'Answer F': '',
    answerWeights: '[1, 2, 3, 4, 5]',
    personalityDimensionCode: 'CON',
    promptImageUrl: '',
    sectionTag: 'Big Five',
  },
];

function generateCSVTemplate(): string {
  const headerRow = TEMPLATE_HEADERS.join(',');
  const instructionRow = [
    'Enter your question text here',
    'OBJECTIVE or PERSONALITY',
    'VERBAL, NUMERICAL, LOGICAL, ATTENTION_TO_DETAIL',
    '30 (between 5-300 seconds)',
    'A (for objective questions only, A=first option, B=second, etc.)',
    'First answer option (required)',
    'Second answer option (required)',
    'Third answer option (optional)',
    'Fourth answer option (optional)',
    'Fifth answer option (optional)',
    'Sixth answer option (optional)',
    '[1,2,3,4,5] (for personality questions only - JSON array of weights)',
    'EXT, AGR, CON, etc. (for personality questions only)',
    'https://example.com/image.jpg (optional)',
    'Optional tag for grouping questions',
  ]
    .map((field) => `"${field}"`)
    .join(',');

  return headerRow + '\n' + instructionRow + '\n';
}

function generateExcelTemplate(): Buffer {
  // Create Excel workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: Empty template (headers only)
  const templateSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);

  // Style the header row
  const headerRange = XLSX.utils.decode_range(templateSheet['!ref'] || 'A1:O1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!templateSheet[address]) continue;
    if (!templateSheet[address].s) {
      templateSheet[address].s = {};
    }
    templateSheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Set column widths for better readability
  templateSheet['!cols'] = [
    { wch: 60 }, // promptText
    { wch: 15 }, // questionType
    { wch: 20 }, // category
    { wch: 12 }, // timerSeconds
    { wch: 18 }, // correctAnswerIndex
    { wch: 25 }, // answerOption1
    { wch: 25 }, // answerOption2
    { wch: 25 }, // answerOption3
    { wch: 25 }, // answerOption4
    { wch: 25 }, // answerOption5
    { wch: 25 }, // answerOption6
    { wch: 30 }, // answerWeights
    { wch: 25 }, // personalityDimensionCode
    { wch: 30 }, // promptImageUrl
    { wch: 20 }, // sectionTag
  ];

  // Add data validation for dropdowns
  const validCategories = Object.values(QuestionCategory);
  const validQuestionTypes = ['OBJECTIVE', 'PERSONALITY'];

  // Create data validation for dropdowns
  if (!templateSheet['!dataValidation']) templateSheet['!dataValidation'] = [];

  // Question Type dropdown (column B, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'B2:B1000',
    type: 'list',
    formula1: `"${validQuestionTypes.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Question Type',
    prompt:
      'Choose OBJECTIVE for right/wrong questions or PERSONALITY for trait assessment',
    errorTitle: 'Invalid Question Type',
    error: `Please select one of: ${validQuestionTypes.join(', ')}`,
  });

  // Category dropdown (column C, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'C2:C1000',
    type: 'list',
    formula1: `"${validCategories.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Category',
    prompt: 'Choose from the available question categories',
    errorTitle: 'Invalid Category',
    error: `Please select one of: ${validCategories.join(', ')}`,
  });

  // Answer index dropdown (column E, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'E2:E1000',
    type: 'list',
    formula1: '"A,B,C,D,E,F"',
    showDropDown: true,
    promptTitle: 'Select Correct Answer',
    prompt:
      'For OBJECTIVE questions: A=first option, B=second option, etc. Leave blank for PERSONALITY questions.',
    allowBlank: true,
  });

  // Personality Dimension dropdown (column M, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'M2:M1000',
    type: 'list',
    formula1: `"${COMMON_PERSONALITY_DIMENSIONS.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Personality Dimension',
    prompt:
      'For PERSONALITY questions only. Choose the trait this question measures.',
    allowBlank: true,
  });

  // Section dropdown (column O, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'O2:O1000',
    type: 'list',
    formula1: `"${COMMON_SECTIONS.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Section',
    prompt: 'Choose a section tag or leave blank',
    allowBlank: true,
  });

  XLSX.utils.book_append_sheet(wb, templateSheet, 'Question Template');

  // Sheet 2: Instructions
  const validCategories2 = Object.values(QuestionCategory).join(', ');
  const validQuestionTypes2 = ['OBJECTIVE', 'PERSONALITY'].join(', ');
  const instructionsData = [
    [
      'Question Import Template - Instructions (Updated for Personality Questions)',
    ],
    [''],
    ['IMPORTANT: Fill out your questions in the "Question Template" sheet!'],
    [''],
    ['NEW FEATURES:'],
    ['• Support for both OBJECTIVE and PERSONALITY questions'],
    ['• Personality dimension mapping for trait assessment'],
    ['• Answer weights for personality scoring'],
    [''],
    ['Column Descriptions:'],
    ['promptText', 'The question text that will be displayed to test takers'],
    [
      'questionType',
      `Must be one of: ${validQuestionTypes2} (dropdown available)`,
    ],
    ['category', `Must be one of: ${validCategories2} (dropdown available)`],
    ['timerSeconds', 'Time limit for this question (5-300 seconds)'],
    [
      'correctAnswerIndex',
      'For OBJECTIVE questions: A=first option, B=second, etc. Leave blank for PERSONALITY',
    ],
    ['Answer A', 'First answer choice (REQUIRED)'],
    ['Answer B', 'Second answer choice (REQUIRED)'],
    ['Answer C', 'Third answer choice (optional)'],
    ['Answer D', 'Fourth answer choice (optional)'],
    ['Answer E', 'Fifth answer choice (optional)'],
    ['Answer F', 'Sixth answer choice (optional)'],
    [
      'answerWeights',
      'For PERSONALITY questions: JSON array like [1,2,3,4,5]. Leave blank for OBJECTIVE.',
    ],
    [
      'personalityDimensionCode',
      'For PERSONALITY questions: dimension code like EXT, AGR, CON. Leave blank for OBJECTIVE.',
    ],
    ['promptImageUrl', 'URL to an image for the question (optional)'],
    [
      'sectionTag',
      'Optional tag to group related questions (dropdown available)',
    ],
    [''],
    ['OBJECTIVE Questions (Traditional Right/Wrong):'],
    ['• Set questionType to "OBJECTIVE"'],
    ['• Fill in correctAnswerIndex (A, B, C, D, E, or F)'],
    ['• Leave answerWeights and personalityDimensionCode blank'],
    ['• Example: Math problems, vocabulary, logic puzzles'],
    [''],
    ['PERSONALITY Questions (Trait Assessment):'],
    ['• Set questionType to "PERSONALITY"'],
    ['• Leave correctAnswerIndex blank (no right/wrong answer)'],
    ['• Fill in answerWeights as JSON array: [1,2,3,4,5]'],
    ['• Fill in personalityDimensionCode (EXT, AGR, CON, etc.)'],
    [
      '• Use Likert scale answers: Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree',
    ],
    [''],
    ['Common Personality Dimensions:'],
    ['EXT - Extraversion (outgoing vs reserved)'],
    ['AGR - Agreeableness (cooperative vs competitive)'],
    ['CON - Conscientiousness (organized vs flexible)'],
    ['NEU - Neuroticism (emotional stability)'],
    ['OPE - Openness (creative vs practical)'],
    ['DOM - Dominance (assertive vs accommodating)'],
    ['INF - Influence (persuasive vs reserved)'],
    ['STE - Steadiness (patient vs urgent)'],
    ['COM - Compliance (rule-following vs independent)'],
    [''],
    ['Answer Weights Examples:'],
    ['• [1,2,3,4,5] - Standard 5-point scale'],
    ['• [5,4,3,2,1] - Reverse scored (for negative traits)'],
    ['• [1,3,5] - 3-point scale (skip middle values)'],
    [''],
    ['Tips:'],
    [
      '• Use dropdowns for Question Type, Category, Answer Index, Dimension, and Section',
    ],
    [
      '• OBJECTIVE questions need correctAnswerIndex, PERSONALITY questions need weights + dimension',
    ],
    ['• You need at least 2 answer options per question'],
    ['• Empty rows will be automatically skipped'],
    ['• You can save as .xlsx, .xls, or .csv format'],
    ['• Mix OBJECTIVE and PERSONALITY questions in the same file'],
    [''],
    ['Supported File Formats:'],
    ['• Excel (.xlsx, .xls) - with dropdowns and validation'],
    ['• CSV (.csv) - manual entry'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);

  // Style the instructions sheet safely
  const cellsToStyle = [
    {
      address: 'A1',
      style: {
        font: { bold: true, sz: 16, color: { rgb: '2F5496' } },
        alignment: { horizontal: 'center' },
      },
    },
    {
      address: 'A3',
      style: { font: { bold: true, color: { rgb: 'C00000' } } },
    },
    {
      address: 'A5',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A10',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A26',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A32',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A39',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A50',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A55',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A60',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
    {
      address: 'A68',
      style: { font: { bold: true, color: { rgb: '2F5496' } } },
    },
  ];

  cellsToStyle.forEach(({ address, style }) => {
    if (instructionsSheet[address]) {
      if (!instructionsSheet[address].s) {
        instructionsSheet[address].s = {};
      }
      instructionsSheet[address].s = style;
    }
  });

  // Set column widths for instructions
  instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 80 }];

  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

  // Sheet 3: Examples
  const examplesSheet = XLSX.utils.json_to_sheet(SAMPLE_QUESTIONS);

  // Style the examples header
  const exampleRange = XLSX.utils.decode_range(
    examplesSheet['!ref'] || 'A1:O1'
  );
  for (let C = exampleRange.s.c; C <= exampleRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!examplesSheet[address]) continue;
    if (!examplesSheet[address].s) {
      examplesSheet[address].s = {};
    }
    examplesSheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '70AD47' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Set column widths for examples
  examplesSheet['!cols'] = templateSheet['!cols']; // Use same widths as template

  XLSX.utils.book_append_sheet(wb, examplesSheet, 'Examples');

  // Convert to buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * @swagger
 * /api/questions/template:
 *   get:
 *     summary: Download question import template
 *     description: Generate and download a template file for importing both objective and personality questions with dropdowns
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *           default: excel
 *         description: Template format to download
 *     responses:
 *       200:
 *         description: Template file downloaded successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid format specified
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const format = searchParams.get('format') || 'excel';

    if (format === 'csv') {
      const csvContent = generateCSVTemplate();

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename="Question_Import_Template.csv"',
        },
      });
    } else if (format === 'excel') {
      const excelBuffer = generateExcelTemplate();

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition':
            'attachment; filename="Question_Import_Template.xlsx"',
        },
      });
    } else {
      return NextResponse.json(
        {
          error: 'Invalid format. Use "excel" or "csv"',
          supportedFormats: ['excel', 'csv'],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(
      '[API /api/questions/template GET] Failed to generate template:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
