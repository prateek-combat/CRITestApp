import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, QuestionCategory } from '@prisma/client';
import * as XLSX from 'xlsx-js-style';
import * as Papa from 'papaparse';

const prisma = new PrismaClient();

interface QuestionRow {
  promptText: string;
  category: string;
  timerSeconds: number;
  correctAnswerIndex: number;
  answerOption1: string;
  answerOption2: string;
  answerOption3?: string;
  answerOption4?: string;
  answerOption5?: string;
  answerOption6?: string;
  promptImageUrl?: string;
  sectionTag?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Enhanced Excel/CSV parser with better error handling
async function parseFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.csv')) {
      // Handle CSV files using Papa Parse for better reliability
      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value?.trim() || '',
      });

      if (result.errors && result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }

      return result.data as any[];
    } else {
      // Handle Excel files with enhanced error handling
      const buffer = await file.arrayBuffer();

      // Try different parsing options for better compatibility
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
          raw: false,
          dateNF: 'dd/mm/yyyy',
        });
      } catch (primaryError) {
        // Fallback parsing with more permissive options
        console.warn(
          'Primary Excel parsing failed, trying fallback:',
          primaryError
        );
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          raw: true,
          cellDates: false,
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      // Convert to JSON with better handling of empty cells
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '', // Default value for empty cells
        raw: false, // Format cells as strings
        dateNF: 'dd/mm/yyyy', // Date format
      });

      // Clean up the data - trim strings and handle various data types
      const cleanedData = rawData.map((row: any) => {
        const cleanedRow: any = {};
        Object.keys(row).forEach((key) => {
          const value = row[key];
          const cleanedKey = key.trim();

          if (typeof value === 'string') {
            cleanedRow[cleanedKey] = value.trim();
          } else if (typeof value === 'number') {
            cleanedRow[cleanedKey] = value.toString();
          } else if (value === null || value === undefined) {
            cleanedRow[cleanedKey] = '';
          } else {
            cleanedRow[cleanedKey] = String(value).trim();
          }
        });
        return cleanedRow;
      });

      return cleanedData;
    }
  } catch (error) {
    console.error('File parsing error:', error);
    throw new Error(
      `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Convert letter format (A, B, C, D, E, F) to numeric index (0, 1, 2, 3, 4, 5)
function convertAnswerIndexToNumber(answerIndex: string): number {
  const letter = answerIndex.toString().toUpperCase().trim();
  const letterToNumber: { [key: string]: number } = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
  };

  // Try letter format first
  if (letterToNumber.hasOwnProperty(letter)) {
    return letterToNumber[letter];
  }

  // Fallback to numeric format for backward compatibility
  const numericIndex = parseInt(letter, 10);
  if (!isNaN(numericIndex)) {
    return numericIndex;
  }

  return -1; // Invalid
}

// Enhanced validation with better error messages
function validateRow(row: any, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if row has any data at all
  const hasAnyData = Object.values(row).some(
    (value) => value !== null && value !== undefined && value !== ''
  );

  if (!hasAnyData) {
    errors.push({
      row: rowNumber,
      field: 'row',
      message: 'Row is completely empty',
      value: 'empty',
    });
    return errors; // Skip further validation for empty rows
  }

  // Validate required fields with better messages
  if (
    !row.promptText ||
    typeof row.promptText !== 'string' ||
    !row.promptText.trim()
  ) {
    errors.push({
      row: rowNumber,
      field: 'promptText',
      message: 'Question text is required and cannot be empty',
      value: row.promptText,
    });
  }

  // Validate category with case-insensitive matching
  const validCategories = Object.values(QuestionCategory);
  const categoryUpper = row.category?.toString().toUpperCase();
  const validCategory = validCategories.find(
    (cat) => cat.toUpperCase() === categoryUpper
  );

  if (!validCategory) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: `Category must be one of: ${validCategories.join(', ')} (case-insensitive)`,
      value: row.category,
    });
  }

  // Validate timer seconds with better error handling
  const timerSecondsStr = row.timerSeconds?.toString() || '';
  const timerSeconds = parseInt(timerSecondsStr, 10);

  if (isNaN(timerSeconds) || timerSeconds < 5 || timerSeconds > 300) {
    errors.push({
      row: rowNumber,
      field: 'timerSeconds',
      message: 'Timer must be a whole number between 5 and 300 seconds',
      value: row.timerSeconds,
    });
  }

  // Collect and validate answer options (support both old and new column names)
  const answerOptions: string[] = [];
  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (let j = 0; j < 6; j++) {
    // Try new format first: "Answer A", "Answer B", etc.
    let option = row[`Answer ${answerLetters[j]}`];

    // Fallback to old format: "answerOption1", "answerOption2", etc.
    if (!option) {
      option = row[`answerOption${j + 1}`];
    }

    if (option && typeof option === 'string' && option.trim()) {
      answerOptions.push(option.trim());
    }
  }

  if (answerOptions.length < 2) {
    errors.push({
      row: rowNumber,
      field: 'answerOptions',
      message: `At least 2 answer options are required. Found ${answerOptions.length} non-empty options.`,
      value: answerOptions.length,
    });
  }

  // Validate correct answer index with new A, B, C, D format
  const correctAnswerIndexStr = row.correctAnswerIndex?.toString() || '';
  const correctAnswerIndex = convertAnswerIndexToNumber(correctAnswerIndexStr);

  if (correctAnswerIndex < 0 || correctAnswerIndex >= answerOptions.length) {
    const letterFormat = ['A', 'B', 'C', 'D', 'E', 'F']
      .slice(0, answerOptions.length)
      .join(', ');
    errors.push({
      row: rowNumber,
      field: 'correctAnswerIndex',
      message: `Correct answer must be one of: ${letterFormat} (A=first option, B=second, etc.) for ${answerOptions.length} answer options`,
      value: row.correctAnswerIndex,
    });
  }

  // Validate image URL if provided
  if (
    row.promptImageUrl &&
    typeof row.promptImageUrl === 'string' &&
    row.promptImageUrl.trim()
  ) {
    const urlStr = row.promptImageUrl.trim();
    try {
      new URL(urlStr);
    } catch {
      // Check if it's a relative path or just missing protocol
      if (
        !urlStr.startsWith('http://') &&
        !urlStr.startsWith('https://') &&
        !urlStr.startsWith('/')
      ) {
        errors.push({
          row: rowNumber,
          field: 'promptImageUrl',
          message:
            'Image URL must be a valid URL (include http:// or https://) or relative path starting with /',
          value: row.promptImageUrl,
        });
      } else {
        errors.push({
          row: rowNumber,
          field: 'promptImageUrl',
          message: 'Invalid URL format',
          value: row.promptImageUrl,
        });
      }
    }
  }

  return errors;
}

/**
 * @swagger
 * /api/questions/import:
 *   post:
 *     summary: Import questions from Excel or CSV file
 *     description: Bulk import questions from an Excel (.xlsx, .xls) or CSV file with predefined column structure
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel or CSV file containing questions
 *               testId:
 *                 type: string
 *                 description: ID of the test to add questions to
 *     responses:
 *       200:
 *         description: Questions imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: number
 *                 total:
 *                   type: number
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation errors or bad request
 *       404:
 *         description: Test not found
 *       500:
 *         description: Failed to import questions
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const testId = formData.get('testId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );
    const hasValidMimeType = validMimeTypes.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)',
          supportedTypes: validExtensions,
        },
        { status: 400 }
      );
    }

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Parse the file with enhanced error handling
    let rawData: any[];
    try {
      rawData = await parseFile(file);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
          suggestion:
            'Please ensure the file is not corrupted and follows the expected format',
        },
        { status: 400 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        {
          error: 'File is empty or contains no data rows',
          suggestion: 'Please add question data below the header row',
        },
        { status: 400 }
      );
    }

    // Validate and process data
    const validationErrors: ValidationError[] = [];
    const validQuestions: any[] = [];
    let emptyRows = 0;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any;
      const rowNumber = i + 2; // Excel row number (1-indexed + header)

      const errors = validateRow(row, rowNumber);

      if (errors.length > 0) {
        // Check if it's just an empty row
        const isEmptyRow =
          errors.length === 1 &&
          errors[0].field === 'row' &&
          errors[0].message === 'Row is completely empty';
        if (isEmptyRow) {
          emptyRows++;
          continue; // Skip empty rows instead of treating as errors
        }
        validationErrors.push(...errors);
      } else {
        // Create valid question object with proper category matching
        const validCategory = Object.values(QuestionCategory).find(
          (cat) => cat.toUpperCase() === row.category.toString().toUpperCase()
        ) as QuestionCategory;

        // Collect answer options (support both old and new column names)
        const answerOptions: string[] = [];
        const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

        for (let j = 0; j < 6; j++) {
          // Try new format first: "Answer A", "Answer B", etc.
          let option = row[`Answer ${answerLetters[j]}`];

          // Fallback to old format: "answerOption1", "answerOption2", etc.
          if (!option) {
            option = row[`answerOption${j + 1}`];
          }

          if (option && typeof option === 'string' && option.trim()) {
            answerOptions.push(option.trim());
          }
        }

        validQuestions.push({
          promptText: row.promptText.trim(),
          category: validCategory,
          timerSeconds: parseInt(row.timerSeconds.toString(), 10),
          answerOptions,
          correctAnswerIndex: convertAnswerIndexToNumber(
            row.correctAnswerIndex.toString()
          ),
          promptImageUrl:
            row.promptImageUrl && row.promptImageUrl.trim()
              ? row.promptImageUrl.trim()
              : null,
          sectionTag:
            row.sectionTag && row.sectionTag.trim()
              ? row.sectionTag.trim()
              : null,
          testId,
        });
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationErrors,
          validRows: validQuestions.length,
          totalRows: rawData.length,
          emptyRows,
          summary: `${validationErrors.length} validation errors found. ${validQuestions.length} valid questions ready for import.`,
        },
        { status: 400 }
      );
    }

    if (validQuestions.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid questions found',
          totalRows: rawData.length,
          emptyRows,
          suggestion:
            'Please check that your file contains valid question data and follows the template format',
        },
        { status: 400 }
      );
    }

    // Create questions in database with transaction for better reliability
    const createdQuestions: any[] = [];

    try {
      // Use a transaction to ensure all questions are created or none are
      await prisma.$transaction(async (tx) => {
        for (const questionData of validQuestions) {
          const question = await tx.question.create({
            data: questionData,
          });
          createdQuestions.push(question);
        }
      });
    } catch (dbError) {
      console.error('Database error during question creation:', dbError);
      return NextResponse.json(
        {
          error: 'Failed to save questions to database',
          details:
            dbError instanceof Error
              ? dbError.message
              : 'Database transaction failed',
          validQuestions: validQuestions.length,
          suggestion:
            'Please try again. If the problem persists, contact support.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: createdQuestions.length,
      total: rawData.length,
      emptyRows,
      questions: createdQuestions,
      message: `Successfully imported ${createdQuestions.length} questions from ${rawData.length} rows (${emptyRows} empty rows skipped)`,
    });
  } catch (error) {
    console.error(
      '[API /api/questions/import POST] Failed to import questions:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to process file upload',
        details:
          error instanceof Error ? error.message : 'Unknown server error',
        suggestion: 'Please try again with a valid Excel or CSV file',
      },
      { status: 500 }
    );
  }
}
