import { NextRequest, NextResponse } from 'next/server';
import { QuestionCategory } from '@prisma/client';
import * as XLSX from 'xlsx-js-style';

// Define the template headers based on the current schema
const TEMPLATE_HEADERS = [
  'promptText',
  'category',
  'timerSeconds',
  'correctAnswerIndex',
  'Answer A',
  'Answer B',
  'Answer C',
  'Answer D',
  'Answer E',
  'Answer F',
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
];

// Sample data for examples using A, B, C, D format
const SAMPLE_QUESTIONS = [
  {
    promptText: 'What is 2 + 2?',
    category: 'NUMERICAL',
    timerSeconds: '15',
    correctAnswerIndex: 'B',
    'Answer A': '3',
    'Answer B': '4',
    'Answer C': '5',
    'Answer D': '6',
    'Answer E': '',
    'Answer F': '',
    promptImageUrl: '',
    sectionTag: 'Basic Math',
  },
  {
    promptText: 'Choose the synonym for "Happy"',
    category: 'VERBAL',
    timerSeconds: '20',
    correctAnswerIndex: 'A',
    'Answer A': 'Joyful',
    'Answer B': 'Sad',
    'Answer C': 'Angry',
    'Answer D': '',
    'Answer E': '',
    'Answer F': '',
    promptImageUrl: '',
    sectionTag: 'Vocabulary',
  },
  {
    promptText: 'What comes next in the sequence: 2, 4, 8, 16, ?',
    category: 'LOGICAL',
    timerSeconds: '30',
    correctAnswerIndex: 'C',
    'Answer A': '24',
    'Answer B': '30',
    'Answer C': '32',
    'Answer D': '36',
    'Answer E': '',
    'Answer F': '',
    promptImageUrl: '',
    sectionTag: 'Pattern Recognition',
  },
];

function generateCSVTemplate(): string {
  const headerRow = TEMPLATE_HEADERS.join(',');
  const instructionRow = [
    'Enter your question text here',
    'VERBAL, NUMERICAL, LOGICAL, SPATIAL, ATTENTION_TO_DETAIL, or GENERAL_KNOWLEDGE',
    '30 (between 5-300 seconds)',
    'A (A=first option, B=second, C=third, etc.)',
    'First answer option (required)',
    'Second answer option (required)',
    'Third answer option (optional)',
    'Fourth answer option (optional)',
    'Fifth answer option (optional)',
    'Sixth answer option (optional)',
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
  const headerRange = XLSX.utils.decode_range(templateSheet['!ref'] || 'A1:L1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!templateSheet[address]) continue;
    templateSheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Set column widths for better readability
  templateSheet['!cols'] = [
    { wch: 50 }, // promptText
    { wch: 20 }, // category
    { wch: 12 }, // timerSeconds
    { wch: 18 }, // correctAnswerIndex
    { wch: 25 }, // answerOption1
    { wch: 25 }, // answerOption2
    { wch: 25 }, // answerOption3
    { wch: 25 }, // answerOption4
    { wch: 25 }, // answerOption5
    { wch: 25 }, // answerOption6
    { wch: 30 }, // promptImageUrl
    { wch: 20 }, // sectionTag
  ];

  // Add data validation for dropdowns
  const validCategories = Object.values(QuestionCategory);

  // Create data validation for category column (B)
  if (!templateSheet['!dataValidation']) templateSheet['!dataValidation'] = [];

  // Category dropdown (column B, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'B2:B1000',
    type: 'list',
    formula1: `"${validCategories.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Category',
    prompt: 'Choose from the available question categories',
    errorTitle: 'Invalid Category',
    error: `Please select one of: ${validCategories.join(', ')}`,
  });

  // Section dropdown (column L, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'L2:L1000',
    type: 'list',
    formula1: `"${COMMON_SECTIONS.join(',')}"`,
    showDropDown: true,
    promptTitle: 'Select Section',
    prompt: 'Choose a section tag or leave blank',
    allowBlank: true,
  });

  // Answer index dropdown (column D, rows 2-1000)
  templateSheet['!dataValidation'].push({
    sqref: 'D2:D1000',
    type: 'list',
    formula1: '"A,B,C,D,E,F"',
    showDropDown: true,
    promptTitle: 'Select Correct Answer',
    prompt: 'A=first option, B=second option, C=third option, etc.',
    errorTitle: 'Invalid Answer Index',
    error: 'Please select A, B, C, D, E, or F',
  });

  XLSX.utils.book_append_sheet(wb, templateSheet, 'Question Template');

  // Sheet 2: Instructions
  const validCategories2 = Object.values(QuestionCategory).join(', ');
  const instructionsData = [
    ['Question Import Template - Instructions'],
    [''],
    ['IMPORTANT: Fill out your questions in the "Question Template" sheet!'],
    [''],
    ['Column Descriptions:'],
    ['promptText', 'The question text that will be displayed to test takers'],
    ['category', `Must be one of: ${validCategories2} (dropdown available)`],
    ['timerSeconds', 'Time limit for this question (5-300 seconds)'],
    [
      'correctAnswerIndex',
      'Letter of correct answer: A=first option, B=second, C=third, etc. (dropdown available)',
    ],
    ['Answer A', 'First answer choice (REQUIRED)'],
    ['Answer B', 'Second answer choice (REQUIRED)'],
    ['Answer C', 'Third answer choice (optional)'],
    ['Answer D', 'Fourth answer choice (optional)'],
    ['Answer E', 'Fifth answer choice (optional)'],
    ['Answer F', 'Sixth answer choice (optional)'],
    ['promptImageUrl', 'URL to an image for the question (optional)'],
    [
      'sectionTag',
      'Optional tag to group related questions (dropdown available)',
    ],
    [''],
    ['Tips:'],
    ['• Use dropdowns for Category, Correct Answer, and Section Tag'],
    ['• You need at least 2 answer options per question'],
    [
      '• Answer format: A=first option, B=second, C=third, etc. (case-insensitive)',
    ],
    ['• Categories are case-insensitive but use the dropdown for accuracy'],
    ['• Empty rows will be automatically skipped'],
    ['• You can save as .xlsx, .xls, or .csv format'],
    [''],
    ['Answer Index Examples:'],
    ['• If correct answer is in answerOption1, use "A"'],
    ['• If correct answer is in answerOption2, use "B"'],
    ['• If correct answer is in answerOption3, use "C"'],
    ['• Case doesn\'t matter: "a", "A", "b", "B" all work'],
    [''],
    ['Supported File Formats:'],
    ['• Excel (.xlsx, .xls) - with dropdowns'],
    ['• CSV (.csv) - manual entry'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);

  // Style the instructions sheet
  instructionsSheet['A1'].s = {
    font: { bold: true, sz: 16, color: { rgb: '2F5496' } },
    alignment: { horizontal: 'center' },
  };

  instructionsSheet['A3'].s = {
    font: { bold: true, color: { rgb: 'C00000' } },
  };

  instructionsSheet['A5'].s = {
    font: { bold: true, color: { rgb: '2F5496' } },
  };

  instructionsSheet['A19'].s = {
    font: { bold: true, color: { rgb: '2F5496' } },
  };

  instructionsSheet['A27'].s = {
    font: { bold: true, color: { rgb: '2F5496' } },
  };

  instructionsSheet['A33'].s = {
    font: { bold: true, color: { rgb: '2F5496' } },
  };

  // Set column widths for instructions
  instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 80 }];

  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

  // Sheet 3: Examples
  const examplesSheet = XLSX.utils.json_to_sheet(SAMPLE_QUESTIONS);

  // Style the examples header
  const exampleRange = XLSX.utils.decode_range(
    examplesSheet['!ref'] || 'A1:L1'
  );
  for (let C = exampleRange.s.c; C <= exampleRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!examplesSheet[address]) continue;
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
 *     description: Generate and download a template file for importing questions with dropdowns for categories and sections
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
