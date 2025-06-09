'use client';

import { useState, useEffect } from 'react';
// Define question categories locally to avoid Prisma client issues
const QUESTION_CATEGORIES = [
  'LOGICAL',
  'VERBAL',
  'NUMERICAL',
  'ATTENTION_TO_DETAIL',
] as const;
import { useRouter } from 'next/navigation';

// --- Constants ---
const ADMIN_USER_ID = '4387fa5a-2267-45c6-a68d-ad372276dcc6';
const QUESTION_TIMERS = [15, 30, 45, 60];
const DEFAULT_ANSWER_OPTIONS = ['', '', '', '']; // Default to 4 options
const AUTH_KEY = 'isAdminLoggedIn_superSimple'; // Auth key

// --- Interfaces ---
interface Question {
  id: string;
  promptText: string;
  promptImageUrl?: string | null;
  answerOptions: string[];
  correctAnswerIndex: number;
  category: (typeof QUESTION_CATEGORIES)[number];
  timerSeconds: number;
  testId: string;
  // Add other relevant fields from your actual Question model if needed
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  overallTimeLimitSeconds: number;
  // Fields from API list view
  createdBy?: { firstName?: string | null; lastName?: string | null };
  _count?: { questions: number };
}

interface NewQuestionForm {
  promptText: string;
  promptImageUrl: string;
  answerOptions: string[];
  correctAnswerIndex: string; // Store as string for form input, parse on submit
  timerSeconds: string; // Store as string for form input
  category: (typeof QUESTION_CATEGORIES)[number] | ''; // Allow empty for initial state
}

export default function ManageTestsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // --- State for Tests ---
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [errorTests, setErrorTests] = useState<string | null>(null);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [errorCreateTest, setErrorCreateTest] = useState<string | null>(null);

  // --- State for Selected Test & Its Questions ---
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isLoadingSelectedTest, setIsLoadingSelectedTest] = useState(false);
  const [errorSelectedTest, setErrorSelectedTest] = useState<string | null>(
    null
  );
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null); // For delete loading state

  const initialNewQuestionState: NewQuestionForm = {
    promptText: '',
    promptImageUrl: '',
    answerOptions: [...DEFAULT_ANSWER_OPTIONS],
    correctAnswerIndex: '0',
    timerSeconds: QUESTION_TIMERS[0].toString(),
    category: '' as (typeof QUESTION_CATEGORIES)[number] | '',
  };
  const [newQuestion, setNewQuestion] = useState<NewQuestionForm>(
    initialNewQuestionState
  );
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [errorAddQuestion, setErrorAddQuestion] = useState<string | null>(null);

  // State for Invitations
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [createdInvitationLink, setCreatedInvitationLink] = useState<
    string | null
  >(null);
  const [errorCreateInvitation, setErrorCreateInvitation] = useState<
    string | null
  >(null);
  const [invitationCandidateEmail, setInvitationCandidateEmail] = useState('');
  const [invitationCandidateName, setInvitationCandidateName] = useState('');

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem(AUTH_KEY) !== 'true'
    ) {
      router.replace('/admin/login');
    } else {
      fetchTests();
    }
  }, [router]);

  useEffect(() => {
    if (
      selectedTest &&
      !selectedTest.questions.length &&
      selectedTest._count &&
      selectedTest._count.questions > 0
    ) {
      // If test is selected, has a question count, but questions array is empty, fetch full details
      fetchTestDetails(selectedTest.id);
    } else if (selectedTest && selectedTest.questions.length) {
      // If questions are already loaded, clear any previous loading/error state for selected test
      setIsLoadingSelectedTest(false);
      setErrorSelectedTest(null);
    }
  }, [selectedTest]);

  // --- Data Fetching ---
  const fetchTests = async () => {
    setIsLoadingTests(true);
    setErrorTests(null);
    try {
      const response = await fetch('/api/tests'); // This endpoint returns _count.questions
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tests');
      }
      const data = await response.json();
      setTests(data.map((test: any) => ({ ...test, questions: [] })) || []); // Initialize with empty questions
    } catch (err) {
      setErrorTests(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoadingTests(false);
    }
  };

  const fetchTestDetails = async (testId: string) => {
    setIsLoadingSelectedTest(true);
    setErrorSelectedTest(null);
    try {
      const response = await fetch(`/api/tests/${testId}`);
      if (!response.ok)
        throw new Error(
          (await response.json()).message || 'Failed to fetch test details'
        );
      const data: Test = await response.json();
      setSelectedTest(data);
      // Update the main tests list to ensure consistency if a test's details (like question count) were updated elsewhere.
      setTests((prevTests) =>
        prevTests.map((t) =>
          t.id === testId
            ? { ...t, ...data, questions: data.questions || t.questions }
            : t
        )
      );
    } catch (err) {
      setErrorSelectedTest(
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setIsLoadingSelectedTest(false);
    }
  };

  // --- Event Handlers ---
  const handleCreateTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) {
      setErrorCreateTest('Test title is required.');
      return;
    }
    setIsCreatingTest(true);
    setErrorCreateTest(null);
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle,
          description: newTestDescription,
          createdById: ADMIN_USER_ID,
          overallTimeLimitSeconds: 1800, // Default: 30 mins
          lockOrder: false,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create test');
      }
      setNewTestTitle('');
      setNewTestDescription('');
      fetchTests(); // Refresh the list
    } catch (err) {
      setErrorCreateTest(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleSelectTest = (test: Test) => {
    setSelectedTest(test);
    setNewQuestion(initialNewQuestionState);
    setErrorAddQuestion(null);
    setCreatedInvitationLink(null); // Clear previous invitation link
    setErrorCreateInvitation(null); // Clear previous invitation error
    if (
      !test.questions ||
      (test._count && test.questions.length !== test._count.questions)
    ) {
      fetchTestDetails(test.id);
    }
  };

  const handleNewQuestionChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerOptionChange = (index: number, value: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answerOptions: prev.answerOptions.map((opt, i) =>
        i === index ? value : opt
      ),
    }));
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedTest ||
      !newQuestion.promptText.trim() ||
      newQuestion.category === '' ||
      !newQuestion.timerSeconds
    ) {
      setErrorAddQuestion(
        'Prompt, category, and timer are required for a question.'
      );
      return;
    }
    if (newQuestion.answerOptions.some((opt) => !opt.trim())) {
      setErrorAddQuestion('All active answer options must be filled.');
      return;
    }
    const correctAnswerIdx = parseInt(newQuestion.correctAnswerIndex);
    if (
      isNaN(correctAnswerIdx) ||
      correctAnswerIdx < 0 ||
      correctAnswerIdx >= newQuestion.answerOptions.length
    ) {
      setErrorAddQuestion('Valid correct answer selection is required.');
      return;
    }

    setIsAddingQuestion(true);
    setErrorAddQuestion(null);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuestion,
          testId: selectedTest.id,
          timerSeconds: parseInt(newQuestion.timerSeconds),
          correctAnswerIndex: correctAnswerIdx,
          promptImageUrl: newQuestion.promptImageUrl.trim() || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add question');
      }
      setNewQuestion(initialNewQuestionState); // Reset form
      fetchTestDetails(selectedTest.id); // Refresh questions for the current test
    } catch (err) {
      setErrorAddQuestion(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!selectedTest) return;

    // Client-side validation for new fields
    if (!invitationCandidateEmail.trim() || !invitationCandidateName.trim()) {
      setErrorCreateInvitation(
        'Candidate Email and Name are required to create an invitation.'
      );
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(invitationCandidateEmail)) {
      setErrorCreateInvitation(
        'Please enter a valid email address for the candidate.'
      );
      return;
    }

    setIsCreatingInvitation(true);
    setErrorCreateInvitation(null);
    setCreatedInvitationLink(null);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: selectedTest.id,
          createdById: ADMIN_USER_ID,
          expiresAt: expiresAt.toISOString(),
          candidateEmail: invitationCandidateEmail.trim(),
          candidateName: invitationCandidateName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invitation');
      }
      const invitationData = await response.json();
      // Construct a user-friendly link to take the test
      const baseAppUrl =
        typeof window !== 'undefined' ? window.location.origin : '';
      setCreatedInvitationLink(`${baseAppUrl}/test/${invitationData.id}`);
      // Clear form fields on success
      setInvitationCandidateEmail('');
      setInvitationCandidateName('');
    } catch (err) {
      setErrorCreateInvitation(
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this test and all its associated questions and attempts? This action cannot be undone.'
      )
    ) {
      return;
    }
    setDeletingTestId(testId);
    setErrorTests(null); // Clear previous general test errors
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete test');
      }
      setTests((prevTests) => prevTests.filter((t) => t.id !== testId));
      if (selectedTest?.id === testId) {
        setSelectedTest(null); // Clear selection if the deleted test was selected
      }
    } catch (err) {
      // Display error specific to test deletion, perhaps near the test list or as a general notification
      setErrorTests(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while deleting the test.'
      );
      // Alternatively, use a more specific error state for delete operations if needed
    } finally {
      setDeletingTestId(null);
    }
  };

  // --- Rendering ---
  if (
    !isClient ||
    (typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) !== 'true')
  ) {
    // Render nothing or a loading indicator while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-off-white">
        <p className="text-lg text-text-light">Loading...</p>
      </div>
    );
  }

  // Helper for input classes
  const inputClasses =
    'block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent-orange focus:border-accent-orange sm:text-sm text-text-dark';
  const labelClasses = 'block text-sm font-medium text-text-light mb-1';
  const buttonClasses = (color: 'green' | 'orange' | 'blue') =>
    `px-6 py-2.5 font-semibold rounded-md shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 text-primary-white ${
      {
        green:
          'bg-military-green hover:bg-military-green/90 focus:ring-military-green',
        orange:
          'bg-accent-orange hover:bg-accent-orange/90 focus:ring-accent-orange',
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500', // Keeping blue for invite for now
      }[color]
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="min-h-screen bg-off-white p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Tests</h1>
      </header>

      <section className="mb-10 rounded-lg bg-primary-white p-6 shadow-xl">
        <h2 className="mb-5 border-b pb-3 text-2xl font-semibold text-text-dark">
          Create New Test
        </h2>
        <form onSubmit={handleCreateTestSubmit} className="space-y-5">
          <div>
            <label htmlFor="newTestTitle" className={labelClasses}>
              Test Title
            </label>
            <input
              type="text"
              id="newTestTitle"
              value={newTestTitle}
              onChange={(e) => setNewTestTitle(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Advanced Logic Challenge"
              required
            />
          </div>
          <div>
            <label htmlFor="newTestDescription" className={labelClasses}>
              Description (Optional)
            </label>
            <textarea
              id="newTestDescription"
              value={newTestDescription}
              onChange={(e) => setNewTestDescription(e.target.value)}
              rows={3}
              className={inputClasses}
              placeholder="A brief overview"
            />
          </div>
          {errorCreateTest && (
            <p className="text-sm text-red-500">{errorCreateTest}</p>
          )}
          <button
            type="submit"
            disabled={isCreatingTest}
            className={buttonClasses('green') + ' w-full sm:w-auto'}
          >
            {isCreatingTest ? 'Creating...' : 'Create Test'}
          </button>
        </form>
      </section>

      <section className="mb-10 rounded-lg bg-primary-white p-6 shadow-xl">
        <h2 className="mb-5 border-b pb-3 text-2xl font-semibold text-text-dark">
          Existing Tests
        </h2>
        {isLoadingTests && <p className="text-text-light">Loading tests...</p>}
        {errorTests && <p className="text-red-500">Error: {errorTests}</p>}
        {!isLoadingTests && !errorTests && tests.length === 0 && (
          <p className="text-text-light">No tests found. Create one above.</p>
        )}
        {!isLoadingTests && !errorTests && tests.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`rounded-lg border p-5 shadow-lg transition-all duration-200 ease-in-out hover:shadow-2xl ${selectedTest?.id === test.id ? 'bg-orange-50 ring-2 ring-accent-orange' : 'border-gray-200 bg-primary-white'}`}
              >
                <div
                  onClick={() => handleSelectTest(test)}
                  className="cursor-pointer"
                >
                  <h3 className="mb-2 text-xl font-semibold text-military-green">
                    {test.title}
                  </h3>
                  <p className="mb-1 truncate text-sm text-text-light">
                    {test.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-400">ID: {test.id}</p>
                  <p className="mt-2 text-sm font-medium text-accent-orange">
                    Questions:{' '}
                    {test._count
                      ? test._count.questions
                      : test.questions
                        ? test.questions.length
                        : 0}
                  </p>
                </div>
                <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTest(test.id);
                    }}
                    disabled={deletingTestId === test.id}
                    className={`rounded-md px-4 py-1.5 text-xs font-medium shadow-sm transition-colors ${deletingTestId === test.id ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-primary-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'}`}
                  >
                    {deletingTestId === test.id ? 'Deleting...' : 'Delete Test'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedTest && (
        <section className="mt-10 rounded-lg border-t-4 border-military-green bg-primary-white p-6 shadow-2xl">
          <div className="mb-6 flex flex-wrap items-center justify-between border-b pb-3">
            <h2 className="text-3xl font-semibold text-military-green">
              Details for:{' '}
              <span className="text-accent-orange">{selectedTest.title}</span>
            </h2>
            <button
              onClick={() => setSelectedTest(null)}
              className="mt-2 rounded-md border px-4 py-2 text-sm font-medium text-text-light transition hover:bg-gray-100 md:mt-0"
            >
              Close Details
            </button>
          </div>

          {isLoadingSelectedTest && (
            <p className="text-text-light">Loading questions...</p>
          )}
          {errorSelectedTest && (
            <p className="text-red-500">Error: {errorSelectedTest}</p>
          )}

          {!isLoadingSelectedTest && !errorSelectedTest && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Column: Questions List & Invite */}
              <div>
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-semibold text-text-dark">
                    Existing Questions ({selectedTest.questions.length})
                  </h3>
                  {selectedTest.questions.length === 0 ? (
                    <p className="rounded-md bg-gray-50 p-4 text-text-light">
                      No questions yet. Add one using the form.
                    </p>
                  ) : (
                    <ul className="max-h-96 space-y-3 overflow-y-auto pr-2">
                      {selectedTest.questions.map((q, index) => (
                        <li
                          key={q.id}
                          className="rounded-md border bg-off-white p-4 shadow-sm"
                        >
                          <p className="font-medium text-text-dark">
                            {index + 1}. {q.promptText}
                          </p>
                          <p className="mt-1 text-xs text-text-light">
                            Type:{' '}
                            <span className="font-semibold text-accent-orange">
                              General
                            </span>{' '}
                            | Timer: {q.timerSeconds}s
                          </p>
                          {/* TODO: Edit/Delete buttons */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 text-xl font-semibold text-text-dark">
                    Create Invitation
                  </h3>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateInvitation();
                    }}
                    className="mb-4 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="invitationCandidateEmail"
                        className={labelClasses}
                      >
                        Candidate Email
                      </label>
                      <input
                        type="email"
                        id="invitationCandidateEmail"
                        value={invitationCandidateEmail}
                        onChange={(e) =>
                          setInvitationCandidateEmail(e.target.value)
                        }
                        className={inputClasses}
                        placeholder="candidate@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="invitationCandidateName"
                        className={labelClasses}
                      >
                        Candidate Name
                      </label>
                      <input
                        type="text"
                        id="invitationCandidateName"
                        value={invitationCandidateName}
                        onChange={(e) =>
                          setInvitationCandidateName(e.target.value)
                        }
                        className={inputClasses}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <button
                      type="submit" // Changed to submit to trigger form onSubmit
                      disabled={
                        isCreatingInvitation ||
                        selectedTest.questions.length === 0
                      }
                      className={buttonClasses('blue')}
                      title={
                        selectedTest.questions.length === 0
                          ? 'Add questions before creating an invitation'
                          : 'Create invitation for this test'
                      }
                    >
                      {isCreatingInvitation
                        ? 'Generating Link...'
                        : 'Generate Test Link'}
                    </button>
                  </form>

                  {errorCreateInvitation && (
                    <p className="mt-2 text-sm text-red-500">
                      Error: {errorCreateInvitation}
                    </p>
                  )}
                  {createdInvitationLink && (
                    <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3">
                      <p className="mb-1 text-sm text-green-700">
                        Invitation created! Share this link:
                      </p>
                      <input
                        type="text"
                        readOnly
                        value={createdInvitationLink}
                        className={inputClasses + ' bg-primary-white'}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Add New Question Form */}
              <div className="rounded-lg bg-off-white p-6 shadow-inner">
                <h3 className="mb-5 border-b pb-2 text-xl font-semibold text-text-dark">
                  Add New Question
                </h3>
                <form onSubmit={handleAddQuestionSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="promptText" className={labelClasses}>
                      Prompt Text
                    </label>
                    <textarea
                      name="promptText"
                      value={newQuestion.promptText}
                      onChange={handleNewQuestionChange}
                      required
                      rows={3}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="promptImageUrl" className={labelClasses}>
                      Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      name="promptImageUrl"
                      value={newQuestion.promptImageUrl}
                      onChange={handleNewQuestionChange}
                      className={inputClasses}
                    />
                  </div>

                  {newQuestion.answerOptions.map((option, index) => (
                    <div key={`answer-${index}`}>
                      <label
                        htmlFor={`answerOption${index}`}
                        className={labelClasses}
                      >
                        Answer Option {index + 1}
                      </label>
                      <input
                        type="text"
                        id={`answerOption${index}`}
                        value={option}
                        onChange={(e) =>
                          handleAnswerOptionChange(index, e.target.value)
                        }
                        required
                        className={inputClasses}
                      />
                    </div>
                  ))}

                  <div>
                    <label
                      htmlFor="correctAnswerIndex"
                      className={labelClasses}
                    >
                      Correct Answer
                    </label>
                    <select
                      name="correctAnswerIndex"
                      value={newQuestion.correctAnswerIndex}
                      onChange={handleNewQuestionChange}
                      required
                      className={inputClasses + ' cursor-pointer'}
                    >
                      {newQuestion.answerOptions.map((_, index) => (
                        <option
                          key={`correct-${index}`}
                          value={index.toString()}
                        >
                          Option {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="timerSeconds" className={labelClasses}>
                        Timer (seconds)
                      </label>
                      <select
                        name="timerSeconds"
                        value={newQuestion.timerSeconds}
                        onChange={handleNewQuestionChange}
                        required
                        className={inputClasses + ' cursor-pointer'}
                      >
                        {QUESTION_TIMERS.map((time) => (
                          <option key={time} value={time.toString()}>
                            {time}s
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="category" className={labelClasses}>
                        Category
                      </label>
                      <select
                        name="category"
                        value={newQuestion.category}
                        onChange={handleNewQuestionChange}
                        required
                        className={inputClasses + ' cursor-pointer'}
                      >
                        <option value="" disabled>
                          Select a category
                        </option>
                        {QUESTION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {errorAddQuestion && (
                    <p className="text-sm text-red-500">{errorAddQuestion}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isAddingQuestion}
                    className={buttonClasses('orange') + ' w-full'}
                  >
                    {isAddingQuestion ? 'Adding...' : 'Add Question to Test'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
