'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
// Define question categories locally to avoid Prisma client issues
const QUESTION_CATEGORIES = [
  'LOGICAL',
  'VERBAL',
  'NUMERICAL',
  'ATTENTION_TO_DETAIL',
] as const;

interface PersonalityDimension {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  timerSeconds: number;
  answerOptions: string[];
  correctAnswerIndex: number | null;
  sectionTag: string | null;
  category: string;
  questionType?: 'OBJECTIVE' | 'PERSONALITY';
  personalityDimensionId?: string | null;
  answerWeights?: Record<string, number> | null;
  personalityDimension?: PersonalityDimension;
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
  const { data: session } = useSession();
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [personalityDimensions, setPersonalityDimensions] = useState<
    PersonalityDimension[]
  >([]);
  const [questionType, setQuestionType] = useState<'OBJECTIVE' | 'PERSONALITY'>(
    'OBJECTIVE'
  );
  const [editQuestionType, setEditQuestionType] = useState<
    'OBJECTIVE' | 'PERSONALITY'
  >('OBJECTIVE');
  const [answerWeights, setAnswerWeights] = useState<Record<string, number>>({
    A: 3,
    B: 3,
    C: 3,
    D: 3,
    E: 3,
  });
  const [editAnswerWeights, setEditAnswerWeights] = useState<
    Record<string, number>
  >({ A: 3, B: 3, C: 3, D: 3, E: 3 });
  const [questionFilter, setQuestionFilter] = useState<
    'ALL' | 'OBJECTIVE' | 'PERSONALITY'
  >('ALL');

  useEffect(() => {
    fetchTest();
    fetchPersonalityDimensions();
  }, []);

  const fetchPersonalityDimensions = async () => {
    try {
      const response = await fetch('/api/personality-dimensions');
      if (response.ok) {
        const dimensions = await response.json();
        setPersonalityDimensions(dimensions);
      }
    } catch (err) {
      console.error('Failed to fetch personality dimensions:', err);
    }
  };

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
    const maxOptions = questionType === 'PERSONALITY' ? 5 : 4;
    for (let i = 0; i < maxOptions; i++) {
      const option = formData.get(`option${i}`);
      if (option) answerOptions.push(option.toString());
    }

    const questionData: any = {
      promptText: formData.get('promptText'),
      timerSeconds: parseInt(formData.get('timerSeconds') as string),
      answerOptions,
      category: formData.get('category'),
      sectionTag: formData.get('sectionTag') || null,
      questionType,
      testId: id,
    };

    if (questionType === 'OBJECTIVE') {
      questionData.correctAnswerIndex = parseInt(
        formData.get('correctAnswerIndex') as string
      );
    } else {
      questionData.personalityDimensionId = formData.get(
        'personalityDimensionId'
      );
      questionData.answerWeights = answerWeights;
      questionData.correctAnswerIndex = null;
    }

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
      setQuestionType('OBJECTIVE');
      setAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    }
  };

  const handleWeightChange = (option: string, weight: number) => {
    setAnswerWeights((prev) => ({ ...prev, [option]: weight }));
  };

  const handleEditWeightChange = (option: string, weight: number) => {
    setEditAnswerWeights((prev) => ({ ...prev, [option]: weight }));
  };

  const renderWeightMatrix = (
    weights: Record<string, number>,
    onChange: (option: string, weight: number) => void,
    isEdit = false
  ) => {
    const options = ['A', 'B', 'C', 'D', 'E'];
    return (
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Answer Weights (1-5 scale)
        </label>
        {options.map((option, index) => (
          <div key={option} className="flex items-center space-x-4">
            <span className="w-16 text-sm font-medium text-gray-700">
              Option {option}:
            </span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((weight) => (
                <label key={weight} className="flex items-center">
                  <input
                    type="radio"
                    name={`${isEdit ? 'edit-' : ''}weight-${option}`}
                    value={weight}
                    checked={weights[option] === weight}
                    onChange={() => onChange(option, weight)}
                    className="mr-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-600">{weight}</span>
                </label>
              ))}
            </div>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 transition-all duration-300"
                  style={{ width: `${(weights[option] / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Calculate personality statistics
  const getPersonalityStats = () => {
    if (!test)
      return {
        totalPersonality: 0,
        totalObjective: 0,
        dimensionsCovered: 0,
        dimensionCounts: {},
        personalityPercentage: 0,
      };

    const personalityQuestions = test.questions.filter(
      (q) => q.questionType === 'PERSONALITY'
    );
    const objectiveQuestions = test.questions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );

    const dimensionCounts = personalityQuestions.reduce(
      (acc, question) => {
        if (question.personalityDimension) {
          const dimension = question.personalityDimension;
          if (!acc[dimension.id]) {
            acc[dimension.id] = {
              dimension,
              count: 0,
            };
          }
          acc[dimension.id].count++;
        }
        return acc;
      },
      {} as Record<string, { dimension: PersonalityDimension; count: number }>
    );

    const personalityPercentage =
      test.questions.length > 0
        ? Math.round(
            (personalityQuestions.length / test.questions.length) * 100
          )
        : 0;

    return {
      totalPersonality: personalityQuestions.length,
      totalObjective: objectiveQuestions.length,
      dimensionsCovered: Object.keys(dimensionCounts).length,
      dimensionCounts,
      personalityPercentage,
    };
  };

  // Filter questions based on selected filter
  const getFilteredQuestions = () => {
    if (!test) return [];
    if (questionFilter === 'ALL') return test.questions;
    if (questionFilter === 'PERSONALITY')
      return test.questions.filter((q) => q.questionType === 'PERSONALITY');
    return test.questions.filter((q) => q.questionType !== 'PERSONALITY');
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

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditQuestionType(question.questionType || 'OBJECTIVE');
    if (question.answerWeights) {
      setEditAnswerWeights(question.answerWeights);
    } else {
      setEditAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
    }
    setShowEditForm(true);
    setShowQuestionForm(false);
  };

  const handleUpdateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const formData = new FormData(e.currentTarget);
    const answerOptions = [];
    const maxOptions = editQuestionType === 'PERSONALITY' ? 5 : 4;
    for (let i = 0; i < maxOptions; i++) {
      const option = formData.get(`option${i}`);
      if (option) answerOptions.push(option.toString());
    }

    const questionData: any = {
      promptText: formData.get('promptText'),
      timerSeconds: parseInt(formData.get('timerSeconds') as string),
      answerOptions,
      category: formData.get('category'),
      sectionTag: formData.get('sectionTag') || null,
      questionType: editQuestionType,
    };

    if (editQuestionType === 'OBJECTIVE') {
      questionData.correctAnswerIndex = parseInt(
        formData.get('correctAnswerIndex') as string
      );
    } else {
      questionData.personalityDimensionId = formData.get(
        'personalityDimensionId'
      );
      questionData.answerWeights = editAnswerWeights;
      questionData.correctAnswerIndex = null;
    }

    try {
      const response = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update question');
      }

      await fetchTest(); // Refresh the test data
      setShowEditForm(false);
      setEditingQuestion(null);
      setEditQuestionType('OBJECTIVE');
      setEditAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update question'
      );
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this question? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete question');
      }

      await fetchTest(); // Refresh the test data
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete question'
      );
    }
  };

  const handleArchiveTest = async () => {
    if (
      !window.confirm(
        'Are you sure you want to archive this test? This will hide it from the main list but it can be restored later.'
      )
    ) {
      return;
    }

    setIsDeletingTest(true);
    try {
      const response = await fetch(`/api/tests/${id}/archive`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ ${result.message} - Test has been archived and can be restored if needed.`
        );
        router.push('/admin/tests'); // Redirect to tests list
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to archive test'}`);
      }
    } catch (error) {
      console.error('Error archiving test:', error);
      alert('❌ Network error occurred while archiving test');
    } finally {
      setIsDeletingTest(false);
    }
  };

  const handleDeleteTest = async () => {
    if (
      !window.confirm(
        '⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this entire test and ALL associated data including:\n- All questions\n- All invitations\n- All test attempts and results\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to permanently delete this test?\n\n(Consider using "Archive" instead to safely hide the test while keeping data recoverable)'
      )
    ) {
      return;
    }

    // Double confirmation for permanent deletion
    if (
      !window.confirm(
        'FINAL CONFIRMATION:\n\nYou are about to PERMANENTLY DELETE this test.\nThis action is IRREVERSIBLE.\n\nClick OK only if you are absolutely certain.'
      )
    ) {
      return;
    }

    setIsDeletingTest(true);
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ ${result.message}\nDeleted: ${result.deletedTest?.questionsDeleted || 0} questions, ${result.deletedTest?.invitationsDeleted || 0} invitations, ${result.deletedTest?.attemptsDeleted || 0} attempts`
        );
        router.push('/admin/tests'); // Redirect to tests list
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete test'}`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('❌ Network error occurred while deleting test');
    } finally {
      setIsDeletingTest(false);
    }
  };

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
          {session?.user?.role === 'SUPER_ADMIN' && (
            <>
              <button
                onClick={handleArchiveTest}
                disabled={isDeletingTest}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDeletingTest
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                }`}
                title="Archive test (can be restored later)"
              >
                {isDeletingTest ? 'Processing...' : 'Archive Test'}
              </button>
              <button
                onClick={handleDeleteTest}
                disabled={isDeletingTest}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDeletingTest
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
                title="⚠️ PERMANENTLY delete test (cannot be undone!)"
              >
                {isDeletingTest ? 'Processing...' : 'Delete Forever'}
              </button>
            </>
          )}
          {session?.user?.role !== 'SUPER_ADMIN' && (
            <div className="flex items-center text-xs italic text-gray-500">
              Archive/Delete: Super Admin only
            </div>
          )}
        </div>
      </div>

      {/* Test Statistics Cards */}
      {test && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Questions Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white">
                  📝
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  Total Questions
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {test.questions.length}
                </div>
              </div>
            </div>
          </div>

          {/* Question Types Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Question Types
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm">
                    <span className="mr-2">📝</span>
                    <span className="text-gray-600">
                      Objective: {getPersonalityStats().totalObjective}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">🧠</span>
                    <span className="text-gray-600">
                      Personality: {getPersonalityStats().totalPersonality}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {getPersonalityStats().personalityPercentage}%
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500">Personality Questions</div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{
                    width: `${getPersonalityStats().personalityPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Personality Dimensions Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                  🎯
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  Personality Dimensions
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getPersonalityStats().dimensionsCovered}
                </div>
                <div className="text-xs text-gray-500">
                  {getPersonalityStats().totalPersonality > 0
                    ? 'covered'
                    : 'none used'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personality Coverage Section */}
      {test && getPersonalityStats().totalPersonality > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            🧠 Personality Assessment Coverage
          </h3>
          <div className="space-y-4">
            {Object.values(getPersonalityStats().dimensionCounts).map(
              ({ dimension, count }) => (
                <div
                  key={dimension.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                      {dimension.code}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {dimension.name}
                      </div>
                      {dimension.description && (
                        <div className="text-sm text-gray-500">
                          {dimension.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {count} questions
                    </span>
                    {count < 3 && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                        ⚠️ Too few
                      </span>
                    )}
                    {count >= 3 && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        ✅ Good
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {Object.values(getPersonalityStats().dimensionCounts).some(
              ({ count }) => count < 3
            ) && (
              <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-orange-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-orange-800">
                      Recommendation
                    </h4>
                    <p className="mt-1 text-sm text-orange-700">
                      Some personality dimensions have fewer than 3 questions.
                      Consider adding more questions for better assessment
                      reliability.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                    Your file contains data that doesn&apos;t match the expected
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
                            &quot;{error.value}&quot;
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
                      • <strong>NEW:</strong> Supports both OBJECTIVE and
                      PERSONALITY questions
                    </li>
                    <li>
                      • Template now has 15 columns including personality fields
                    </li>
                    <li>
                      • Category must be one of: LOGICAL, VERBAL, NUMERICAL,
                      ATTENTION_TO_DETAIL
                    </li>
                    <li>• Timer must be between 5-300 seconds</li>
                    <li>
                      • <strong>OBJECTIVE:</strong> Use correctAnswerIndex (A,
                      B, C, D, E, F)
                    </li>
                    <li>
                      • <strong>PERSONALITY:</strong> Use answerWeights
                      [1,2,3,4,5] and personalityDimensionCode
                    </li>
                    <li>
                      • Include at least 2 answer options (Answer A, Answer B,
                      etc.)
                    </li>
                    <li>
                      • Download the template for detailed instructions and
                      examples
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
          {/* Question Type Toggle */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Question Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="questionType"
                  value="OBJECTIVE"
                  checked={questionType === 'OBJECTIVE'}
                  onChange={(e) =>
                    setQuestionType(
                      e.target.value as 'OBJECTIVE' | 'PERSONALITY'
                    )
                  }
                  className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  📝 General (Right/Wrong)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="questionType"
                  value="PERSONALITY"
                  checked={questionType === 'PERSONALITY'}
                  onChange={(e) =>
                    setQuestionType(
                      e.target.value as 'OBJECTIVE' | 'PERSONALITY'
                    )
                  }
                  className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🧠 Personality Assessment
                </span>
              </label>
            </div>
          </div>

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
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              name="category"
              id="category"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {QUESTION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Personality Dimension Selector */}
          {questionType === 'PERSONALITY' && (
            <div>
              <label
                htmlFor="personalityDimensionId"
                className="block text-sm font-medium text-gray-700"
              >
                Personality Dimension *
              </label>
              <select
                name="personalityDimensionId"
                id="personalityDimensionId"
                required={questionType === 'PERSONALITY'}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
              >
                <option value="">Select a personality dimension</option>
                {personalityDimensions.map((dimension) => (
                  <option key={dimension.id} value={dimension.id}>
                    {dimension.name} ({dimension.code})
                  </option>
                ))}
              </select>
              {personalityDimensions.length === 0 && (
                <p className="mt-1 text-sm text-orange-600">
                  No personality dimensions available. Please create one first.
                </p>
              )}
            </div>
          )}

          {/* Answer Options - Objective Questions */}
          {questionType === 'OBJECTIVE' && (
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
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
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
          )}

          {/* Answer Options - Personality Questions */}
          {questionType === 'PERSONALITY' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Answer Options (A-E) - No right answer
              </label>
              <div className="mt-2 space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-gray-600">
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <input
                      type="text"
                      name={`option${index}`}
                      required
                      className="flex-grow rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              {/* Weight Matrix */}
              {renderWeightMatrix(answerWeights, handleWeightChange)}
            </div>
          )}

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
              onClick={() => {
                setShowQuestionForm(false);
                setQuestionType('OBJECTIVE');
                setAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
              }}
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

      {/* Edit Question Form */}
      {showEditForm && editingQuestion && (
        <form
          onSubmit={handleUpdateQuestion}
          className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Question
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditingQuestion(null);
                setEditQuestionType('OBJECTIVE');
                setEditAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div
              className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
              role="alert"
            >
              <p className="font-bold">Error updating question:</p>
              <p>{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-promptText"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Question Text
            </label>
            <textarea
              name="promptText"
              id="edit-promptText"
              required
              rows={3}
              defaultValue={editingQuestion.promptText}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
              placeholder="Enter the question text..."
            />
          </div>

          {/* Question Type Toggle */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Question Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="editQuestionType"
                  value="OBJECTIVE"
                  checked={editQuestionType === 'OBJECTIVE'}
                  onChange={(e) =>
                    setEditQuestionType(
                      e.target.value as 'OBJECTIVE' | 'PERSONALITY'
                    )
                  }
                  className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  📝 General (Right/Wrong)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="editQuestionType"
                  value="PERSONALITY"
                  checked={editQuestionType === 'PERSONALITY'}
                  onChange={(e) =>
                    setEditQuestionType(
                      e.target.value as 'OBJECTIVE' | 'PERSONALITY'
                    )
                  }
                  className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🧠 Personality Assessment
                </span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              name="category"
              id="edit-category"
              required
              defaultValue={editingQuestion.category}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {QUESTION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Personality Dimension Selector */}
          {editQuestionType === 'PERSONALITY' && (
            <div>
              <label
                htmlFor="edit-personalityDimensionId"
                className="block text-sm font-medium text-gray-700"
              >
                Personality Dimension *
              </label>
              <select
                name="personalityDimensionId"
                id="edit-personalityDimensionId"
                required={editQuestionType === 'PERSONALITY'}
                defaultValue={editingQuestion.personalityDimensionId || ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
              >
                <option value="">Select a personality dimension</option>
                {personalityDimensions.map((dimension) => (
                  <option key={dimension.id} value={dimension.id}>
                    {dimension.name} ({dimension.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Answer Options - Objective Questions */}
          {editQuestionType === 'OBJECTIVE' && (
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
                      defaultValue={editingQuestion.answerOptions[index] || ''}
                      className="flex-grow rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <input
                      type="radio"
                      name="correctAnswerIndex"
                      value={index}
                      required
                      defaultChecked={
                        index === editingQuestion.correctAnswerIndex
                      }
                      className="h-5 w-5 border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Options - Personality Questions */}
          {editQuestionType === 'PERSONALITY' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Answer Options (A-E) - No right answer
              </label>
              <div className="mt-2 space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-gray-600">
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <input
                      type="text"
                      name={`option${index}`}
                      required
                      defaultValue={editingQuestion.answerOptions[index] || ''}
                      className="flex-grow rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              {/* Weight Matrix */}
              {renderWeightMatrix(
                editAnswerWeights,
                handleEditWeightChange,
                true
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-timerSeconds"
                className="block text-sm font-medium text-gray-700"
              >
                Time Limit (seconds)
              </label>
              <select
                name="timerSeconds"
                id="edit-timerSeconds"
                required
                defaultValue={editingQuestion.timerSeconds}
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
                htmlFor="edit-sectionTag"
                className="block text-sm font-medium text-gray-700"
              >
                Section Tag
              </label>
              <input
                type="text"
                name="sectionTag"
                id="edit-sectionTag"
                defaultValue={editingQuestion.sectionTag || ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 sm:text-sm"
                placeholder="e.g., Logical, Mathematical, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditingQuestion(null);
                setEditQuestionType('OBJECTIVE');
                setEditAnswerWeights({ A: 3, B: 3, C: 3, D: 3, E: 3 });
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update Question
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Questions ({getFilteredQuestions().length}
            {questionFilter !== 'ALL' ? ` of ${test.questions.length}` : ''})
          </h2>

          {/* Question Type Filter */}
          <div className="flex items-center space-x-1 rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setQuestionFilter('ALL')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                questionFilter === 'ALL'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              All ({test.questions.length})
            </button>
            <button
              onClick={() => setQuestionFilter('OBJECTIVE')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                questionFilter === 'OBJECTIVE'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              📝 General ({getPersonalityStats().totalObjective})
            </button>
            <button
              onClick={() => setQuestionFilter('PERSONALITY')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                questionFilter === 'PERSONALITY'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              🧠 Personality ({getPersonalityStats().totalPersonality})
            </button>
          </div>
        </div>
        {getFilteredQuestions().length === 0 ? (
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
              {test.questions.length === 0
                ? 'No questions yet'
                : `No ${questionFilter.toLowerCase()} questions`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {test.questions.length === 0
                ? 'Add the first question to this test using the form above.'
                : `Try selecting a different filter or add ${questionFilter.toLowerCase()} questions.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredQuestions().map((question, index) => {
              // Find the original index for proper numbering
              const originalIndex = test.questions.findIndex(
                (q) => q.id === question.id
              );
              return (
                <div
                  key={question.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {question.questionType === 'PERSONALITY' ? '🧠' : '📝'}{' '}
                        Question {originalIndex + 1}
                      </h3>
                      {question.questionType === 'PERSONALITY' ? (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-xs font-medium text-purple-800">
                          Personality
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                          General
                        </span>
                      )}
                      {question.sectionTag && (
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800">
                          {question.sectionTag}
                        </span>
                      )}
                      {question.questionType === 'PERSONALITY' &&
                        question.personalityDimension && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                            {question.personalityDimension.name}
                          </span>
                        )}
                    </div>
                    {/* Edit/Delete Question buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <MarkdownRenderer
                      content={question.promptText}
                      className="text-sm text-gray-600"
                    />
                  </div>
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
                    {question.questionType === 'PERSONALITY' ? (
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          Answer Options (No right answer):
                        </div>
                        <ul className="mt-2 space-y-1">
                          {question.answerOptions.map((option, optionIndex) => (
                            <li
                              key={optionIndex}
                              className="flex items-center justify-between text-sm text-gray-500"
                            >
                              <span>
                                {String.fromCharCode(65 + optionIndex)}.{' '}
                                {option}
                              </span>
                              {question.answerWeights && (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-400">
                                  Weight:{' '}
                                  {question.answerWeights[
                                    String.fromCharCode(65 + optionIndex)
                                  ] || 'N/A'}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 rounded bg-purple-50 p-2 text-xs text-purple-600">
                          💡 This is a personality assessment question -
                          responses are weighted, not right/wrong
                        </div>
                      </div>
                    ) : (
                      <div>
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
                              {String.fromCharCode(65 + optionIndex)}. {option}
                              {optionIndex === question.correctAnswerIndex &&
                                ' ✓ (Correct)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Time limit: {question.timerSeconds} seconds
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
