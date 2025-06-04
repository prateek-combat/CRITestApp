'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  timerSeconds: number;
  answerOptions: string[];
  correctAnswerIndex: number;
  sectionTag: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

export default function TestEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  useEffect(() => {
    fetchTest();
  }, []);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${id}`);
      if (!response.ok) throw new Error('Failed to fetch test');
      const data = await response.json();
      setTest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const answerOptions = [];
    for (let i = 0; i < 4; i++) {
      const option = formData.get(`option${i}`);
      if (option) answerOptions.push(option.toString());
    }

    const questionData = {
      promptText: formData.get('promptText'),
      timerSeconds: parseInt(formData.get('timerSeconds') as string),
      answerOptions,
      correctAnswerIndex: parseInt(
        formData.get('correctAnswerIndex') as string
      ),
      sectionTag: formData.get('sectionTag') || null,
      testId: id,
    };

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add question');
      }

      await fetchTest(); // Refresh the test data
      setShowQuestionForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - support both Excel and CSV
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv',
        '.xlsx',
        '.xls',
        '.csv',
      ];
      const isValidType = validTypes.some(
        (type) =>
          file.type === type ||
          file.name.toLowerCase().endsWith(type.replace('.', ''))
      );

      if (!isValidType) {
        setError(
          'Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)'
        );
        return;
      }

      setImportFile(file);
      setError(null);
      setImportResult(null);
      setImportErrors([]);
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile) {
      setError('Please select an Excel file first');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('testId', id);

      const response = await fetch('/api/questions/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setImportErrors(result.errors);
          setImportResult(result); // Store the full response for error summary
          setError(`Validation failed: ${result.errors.length} errors found`);
        } else {
          setError(result.error || 'Failed to import questions');
        }
        return;
      }

      setImportResult(result);
      setImportFile(null);
      setShowImportForm(false);
      await fetchTest(); // Refresh the test data

      // Reset file input
      const fileInput = document.getElementById(
        'excel-file'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import questions'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (format: 'excel' | 'csv' = 'excel') => {
    // Download the enhanced template from API
    const link = document.createElement('a');
    link.href = `/api/questions/template?format=${format}`;
    link.download = `Question_Import_Template.${format === 'csv' ? 'csv' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => downloadTemplate('excel');
  const handleDownloadCSV = () => downloadTemplate('csv');

  const getFieldHelp = (field: string, message: string): string => {
    switch (field) {
      case 'promptText':
        return 'Enter the question text. Example: "What is 2 + 2?"';
      case 'category':
        return 'Use the dropdown or enter one of: VERBAL, NUMERICAL, LOGICAL, SPATIAL, ATTENTION_TO_DETAIL, GENERAL_KNOWLEDGE (case-insensitive)';
      case 'timerSeconds':
        return 'Enter a number between 5 and 300. Example: 30';
      case 'correctAnswerIndex':
        return "Use letter format: A=first option, B=second, C=third, etc. Case doesn't matter (a, A, b, B all work)";
      case 'answerOptions':
        return 'You need at least 2 answer options. Fill Answer A and Answer B columns';
      case 'Answer A':
      case 'Answer B':
      case 'answerOption1':
      case 'answerOption2':
        return 'This field is required. Enter the answer option text';
      case 'Answer C':
      case 'Answer D':
      case 'Answer E':
      case 'Answer F':
      case 'answerOption3':
      case 'answerOption4':
      case 'answerOption5':
      case 'answerOption6':
        return 'Optional field. You can leave this empty or add more answer options';
      case 'promptImageUrl':
        return 'Optional. Enter a valid URL if you want to include an image, or leave empty';
      case 'sectionTag':
        return 'Optional. Use the dropdown to select a common section or enter your own tag';
      default:
        return 'Please check the template format and try again';
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading test details...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
        <div
          className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <Link
            href="/admin/tests"
            className="mt-2 inline-block text-sm text-red-600 underline hover:text-red-800"
          >
            Back to tests
          </Link>
        </div>
      </div>
    );
  if (!test)
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
        <div
          className="rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700"
          role="alert"
        >
          <p className="font-bold">Not Found</p>
          <p>Test not found.</p>
          <Link
            href="/admin/tests"
            className="mt-2 inline-block text-sm text-yellow-600 underline hover:text-yellow-800"
          >
            Back to tests
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen space-y-8 bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md md:flex-row md:items-center">
        <div className="flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
          <p className="mt-2 text-base text-gray-600">
            {test.description || 'No description provided.'}
          </p>
          <p className="text-sm text-gray-500">
            {test.questions.length} question
            {test.questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="mt-4 flex flex-shrink-0 gap-3 md:mt-0">
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              showImportForm
                ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {showImportForm ? 'Cancel Import' : 'Import Questions'}
          </button>
          <button
            onClick={() => setShowQuestionForm(!showQuestionForm)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              showQuestionForm
                ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
                : 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500'
            }`}
          >
            {showQuestionForm ? 'Cancel' : 'Add Question'}
          </button>
        </div>
      </div>

      {/* Import Result Success Message */}
      {importResult && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center">
            <svg
              className="mr-2 h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-green-800">
                ✅ Successfully imported {importResult.imported} questions!
              </p>
              <p className="mt-1 text-sm text-green-700">
                {importResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Form */}
      {showImportForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Import Questions from Excel or CSV
          </h3>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Enhanced Features:</strong> Excel templates now include
              dropdowns for categories and sections. Use A, B, C, D format for
              correct answers (case-insensitive). Improved error handling and
              validation.
            </p>
          </div>

          <div className="space-y-6">
            {/* Template Download */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start">
                <svg
                  className="mr-2 mt-0.5 h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">
                    Download Template First
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Download the template with correct headers, instructions,
                    and examples. Choose your preferred format:
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={handleDownloadExcel}
                      className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      📥 Excel Template (.xlsx)
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      📄 CSV Template (.csv)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="excel-file"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Select Excel or CSV File
              </label>
              <input
                type="file"
                id="excel-file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              />
              {importFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Selected: {importFile.name}
                </p>
              )}
            </div>

            {/* Import Errors Display */}
            {importErrors.length > 0 && (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-6">
                <div className="mb-4 flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h4 className="text-lg font-semibold text-red-800">
                    Import Failed - {importErrors.length} validation errors
                    found
                  </h4>
                </div>

                <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-4">
                  <h5 className="mb-2 font-medium text-red-800">
                    ❗ What went wrong:
                  </h5>
                  <p className="text-sm text-red-700">
                    Your file contains data that doesn't match the expected
                    format. Please review the errors below and fix them in your
                    file.
                  </p>
                </div>

                {/* Error Summary */}
                <div className="mb-4 rounded-lg border border-red-200 bg-white p-3">
                  <h5 className="mb-2 font-medium text-red-800">
                    📊 Error Summary:
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-red-700">
                        Total Rows:
                      </span>{' '}
                      {importResult?.totalRows || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium text-red-700">
                        Valid Rows:
                      </span>{' '}
                      {importResult?.validRows || 0}
                    </div>
                    <div>
                      <span className="font-medium text-red-700">
                        Error Rows:
                      </span>{' '}
                      {importErrors.length}
                    </div>
                    <div>
                      <span className="font-medium text-red-700">
                        Success Rate:
                      </span>{' '}
                      {importResult?.totalRows
                        ? Math.round(
                            ((importResult.validRows || 0) /
                              importResult.totalRows) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                {/* Detailed Errors */}
                <div className="space-y-3">
                  <h5 className="font-medium text-red-800">
                    🔍 Detailed Errors:
                  </h5>
                  {importErrors.slice(0, 20).map((error, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-red-300 bg-white p-3"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Row {error.row}
                          </span>
                          <span className="font-medium text-red-700">
                            {error.field}
                          </span>
                        </div>
                      </div>

                      <div className="mb-2 text-sm text-red-600">
                        <strong>Error:</strong> {error.message}
                      </div>

                      {error.value !== undefined && (
                        <div className="mb-2 text-sm text-red-600">
                          <strong>Current Value:</strong>{' '}
                          <code className="rounded bg-red-100 px-1">
                            "{error.value}"
                          </code>
                        </div>
                      )}

                      {/* Field-specific help */}
                      <div className="rounded border-l-4 border-red-400 bg-red-50 p-2 text-sm text-red-700">
                        <strong>💡 Fix:</strong>{' '}
                        {getFieldHelp(error.field, error.message)}
                      </div>
                    </div>
                  ))}

                  {importErrors.length > 20 && (
                    <div className="rounded-lg bg-red-100 p-3 text-center">
                      <p className="text-sm font-medium text-red-700">
                        ... and {importErrors.length - 20} more errors
                      </p>
                      <p className="mt-1 text-xs text-red-600">
                        Fix the errors above first, then re-upload to see
                        remaining issues
                      </p>
                    </div>
                  )}
                </div>

                {/* Common Solutions */}
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h5 className="mb-2 font-medium text-blue-800">
                    🛠️ Common Solutions:
                  </h5>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>
                      • Make sure column headers match exactly: promptText,
                      category, timerSeconds, etc.
                    </li>
                    <li>
                      • Category must be one of: LOGICAL, VERBAL, NUMERICAL,
                      ATTENTION_TO_DETAIL
                    </li>
                    <li>• Timer must be between 5-300 seconds</li>
                    <li>
                      • Correct answer index starts from 0 (0=first option,
                      1=second option, etc.)
                    </li>
                    <li>
                      • Include at least 2 answer options (answerOption1,
                      answerOption2)
                    </li>
                    <li>
                      • Download the template again if you're unsure about the
                      format
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleImportQuestions}
                disabled={!importFile || isImporting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>📤 Import Questions</>
                )}
              </button>
              <button
                onClick={() => {
                  setShowImportForm(false);
                  setImportFile(null);
                  setImportErrors([]);
                  setImportResult(null);
                  const fileInput = document.getElementById(
                    'excel-file'
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuestionForm && (
        <form
          onSubmit={handleAddQuestion}
          className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
        >
          {error && (
            <div
              className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
              role="alert"
            >
              <p className="font-bold">Error adding question:</p>
              <p>{error}</p>
            </div>
          )}
          <div>
            <label
              htmlFor="promptText"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Question Text
            </label>
            <textarea
              name="promptText"
              id="promptText"
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
              placeholder="Enter the question text..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Answer Options (Mark the correct one)
            </label>
            <div className="mt-2 space-y-3">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    name={`option${index}`}
                    required
                    className="flex-grow rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswerIndex"
                    value={index}
                    required
                    className="h-5 w-5 border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="timerSeconds"
                className="block text-sm font-medium text-gray-700"
              >
                Time Limit (seconds)
              </label>
              <select
                name="timerSeconds"
                id="timerSeconds"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
              >
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sectionTag"
                className="block text-sm font-medium text-gray-700"
              >
                Section Tag
              </label>
              <input
                type="text"
                name="sectionTag"
                id="sectionTag"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                placeholder="e.g., Logical, Mathematical, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowQuestionForm(false)}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Question
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Questions ({test.questions.length})
        </h2>
        {test.questions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No questions yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add the first question to this test using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {test.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}
                    {question.sectionTag && (
                      <span className="ml-3 inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800">
                        {question.sectionTag}
                      </span>
                    )}
                  </h3>
                  {/* Placeholder for Edit/Delete Question buttons */}
                  <div className="text-sm">
                    {/* <button className="text-brand-600 hover:text-brand-800 mr-3">Edit</button>
                     <button className="text-red-600 hover:text-red-800">Delete</button> */}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {question.promptText}
                </p>
                {question.promptImageUrl && (
                  <div className="mt-2">
                    <img
                      src={question.promptImageUrl}
                      alt="Question prompt image"
                      className="max-w-xs rounded-md"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <div className="mb-1 text-sm font-medium text-gray-700">
                    Options:
                  </div>
                  <ul className="mt-2 space-y-1">
                    {question.answerOptions.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={`text-sm ${
                          optionIndex === question.correctAnswerIndex
                            ? 'font-medium text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {optionIndex + 1}. {option}
                        {optionIndex === question.correctAnswerIndex &&
                          ' (Correct)'}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Time limit: {question.timerSeconds} seconds
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
