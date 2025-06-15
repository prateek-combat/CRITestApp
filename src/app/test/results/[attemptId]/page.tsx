'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  Legend,
} from 'recharts';
import Link from 'next/link';
import {
  generatePDFReport,
  type TestAttemptData,
} from '@/utils/pdfReportGenerator';

interface PersonalityDimension {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface Question {
  id: string;
  promptText: string;
  answerOptions: string[];
  questionType: 'OBJECTIVE' | 'PERSONALITY';
  personalityDimension?: PersonalityDimension;
  answerWeights?: number[] | Record<string, number>;
}

interface TestAttempt {
  id: string;
  candidateName: string;
  candidateEmail: string;
  answers: Record<string, { answerIndex: number; timeTaken: number }>;
  objectiveScore: number;
  totalQuestions: number;
  personalityScores?: Record<string, number>;
  personalityProfile?: any;
  test: {
    id: string;
    title: string;
    description: string | null;
    questions: Question[];
  };
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'border border-blue-200 bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function TestResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'cognitive' | 'personality' | 'combined'
  >('cognitive');

  useEffect(() => {
    fetchTestAttempt();
  }, [attemptId]);

  const fetchTestAttempt = async () => {
    try {
      const response = await fetch(`/api/test-attempts/${attemptId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch test attempt');
      }
      const data = await response.json();
      setTestAttempt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalityData = () => {
    if (!testAttempt?.personalityScores) return [];

    return Object.entries(testAttempt.personalityScores).map(
      ([dimensionCode, score]) => {
        const dimension = testAttempt.test.questions.find(
          (q) => q.personalityDimension?.code === dimensionCode
        )?.personalityDimension;

        return {
          dimension: dimension?.name || dimensionCode,
          code: dimensionCode,
          score: Number(score),
          fullMark: 5,
        };
      }
    );
  };

  const getPersonalityBarData = () => {
    return getPersonalityData().map((item) => ({
      name: item.dimension,
      score: item.score,
      interpretation: getScoreInterpretation(item.score),
    }));
  };

  const getScoreInterpretation = (score: number): string => {
    if (score >= 4.5) return 'Very High';
    if (score >= 3.5) return 'High';
    if (score >= 2.5) return 'Moderate';
    if (score >= 1.5) return 'Low';
    return 'Very Low';
  };

  const getInterpretationColor = (score: number): string => {
    if (score >= 4.5) return 'text-green-700 bg-green-100';
    if (score >= 3.5) return 'text-blue-700 bg-blue-100';
    if (score >= 2.5) return 'text-yellow-700 bg-yellow-100';
    if (score >= 1.5) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  const getPersonalityQuestions = () => {
    if (!testAttempt) return [];

    return testAttempt.test.questions
      .filter((q) => q.questionType === 'PERSONALITY')
      .map((question) => {
        const answer = testAttempt.answers[question.id];
        const selectedOption = answer
          ? question.answerOptions[answer.answerIndex]
          : 'Not answered';

        // Handle answerWeights - can be either array or object
        let weight = 0;
        if (answer && question.answerWeights) {
          if (Array.isArray(question.answerWeights)) {
            // If it's an array, use the answer index directly
            weight = question.answerWeights[answer.answerIndex] || 0;
          } else {
            // If it's an object, try to access by letter key (legacy format)
            const letterKey = String.fromCharCode(65 + answer.answerIndex);
            weight = question.answerWeights[letterKey] || 0;
          }
        }

        return {
          question: question.promptText,
          dimension: question.personalityDimension?.name || 'Unknown',
          selectedAnswer: selectedOption,
          weight: weight,
          timeTaken: answer?.timeTaken || 0,
        };
      });
  };

  const getCombinedAnalysisData = () => {
    if (!testAttempt?.personalityScores) return [];

    const cognitiveScore =
      (testAttempt.objectiveScore / testAttempt.totalQuestions) * 100;

    return Object.entries(testAttempt.personalityScores).map(
      ([code, score]) => {
        const dimension = testAttempt.test.questions.find(
          (q) => q.personalityDimension?.code === code
        )?.personalityDimension;

        return {
          cognitive: cognitiveScore,
          personality: Number(score),
          dimension: dimension?.name || code,
          code,
        };
      }
    );
  };

  const generateInsights = () => {
    if (!testAttempt) return [];

    const cognitivePercentage =
      (testAttempt.objectiveScore / testAttempt.totalQuestions) * 100;
    const personalityData = getPersonalityData();
    const insights = [];

    // Cognitive performance insight
    if (cognitivePercentage >= 80) {
      insights.push({
        type: 'strength',
        title: 'Strong Cognitive Performance',
        description: `Excellent performance with ${cognitivePercentage.toFixed(1)}% accuracy on objective questions.`,
      });
    } else if (cognitivePercentage >= 60) {
      insights.push({
        type: 'neutral',
        title: 'Good Cognitive Performance',
        description: `Solid performance with ${cognitivePercentage.toFixed(1)}% accuracy on objective questions.`,
      });
    } else {
      insights.push({
        type: 'development',
        title: 'Cognitive Development Opportunity',
        description: `Areas for improvement identified with ${cognitivePercentage.toFixed(1)}% accuracy on objective questions.`,
      });
    }

    // Personality insights
    const highScores = personalityData.filter((p) => p.score >= 4.0);
    const lowScores = personalityData.filter((p) => p.score <= 2.0);

    if (highScores.length > 0) {
      insights.push({
        type: 'strength',
        title: 'Key Personality Strengths',
        description: `Strong in: ${highScores.map((p) => p.dimension).join(', ')}`,
      });
    }

    if (lowScores.length > 0) {
      insights.push({
        type: 'development',
        title: 'Development Areas',
        description: `Consider developing: ${lowScores.map((p) => p.dimension).join(', ')}`,
      });
    }

    return insights;
  };

  const handleGeneratePDFReport = async () => {
    if (!testAttempt) return;

    try {
      await generatePDFReport(testAttempt as TestAttemptData);
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error || !testAttempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-6 text-gray-600">
            {error || 'Test results not found'}
          </p>
          <Link
            href="/admin"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  const cognitivePercentage =
    (testAttempt.objectiveScore / testAttempt.totalQuestions) * 100;
  const personalityData = getPersonalityData();
  const personalityBarData = getPersonalityBarData();
  const personalityQuestions = getPersonalityQuestions();
  const combinedData = getCombinedAnalysisData();
  const insights = generateInsights();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
              <p className="mt-2 text-gray-600">
                {testAttempt.candidateName} • {testAttempt.test.title}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGeneratePDFReport}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Export PDF Report</span>
              </button>
              <Link
                href="/admin"
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-200"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex space-x-2">
          <Tab
            label="Cognitive Performance"
            isActive={activeTab === 'cognitive'}
            onClick={() => setActiveTab('cognitive')}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />
          {personalityData.length > 0 && (
            <Tab
              label="Personality Profile"
              isActive={activeTab === 'personality'}
              onClick={() => setActiveTab('personality')}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
          )}
          {personalityData.length > 0 && (
            <Tab
              label="Combined Analysis"
              isActive={activeTab === 'combined'}
              onClick={() => setActiveTab('combined')}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
            />
          )}
        </div>

        {/* Tab Content */}
        <div className="rounded-lg bg-white shadow-lg">
          {activeTab === 'cognitive' && (
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Cognitive Performance
              </h2>

              {/* Score Overview */}
              <div className="mb-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {testAttempt.objectiveScore}
                  </div>
                  <div className="text-sm text-blue-700">Correct Answers</div>
                </div>
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {cognitivePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Accuracy Rate</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {testAttempt.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-700">Total Questions</div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Performance Analysis
                </h3>
                <div className="space-y-4">
                  {cognitivePercentage >= 90 && (
                    <div className="flex items-start space-x-3 rounded-lg bg-green-100 p-4">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-green-800">
                          Excellent Performance
                        </h4>
                        <p className="text-green-700">
                          Outstanding cognitive performance with exceptional
                          accuracy.
                        </p>
                      </div>
                    </div>
                  )}
                  {cognitivePercentage >= 70 && cognitivePercentage < 90 && (
                    <div className="flex items-start space-x-3 rounded-lg bg-blue-100 p-4">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-blue-800">
                          Good Performance
                        </h4>
                        <p className="text-blue-700">
                          Solid cognitive performance with good problem-solving
                          abilities.
                        </p>
                      </div>
                    </div>
                  )}
                  {cognitivePercentage < 70 && (
                    <div className="flex items-start space-x-3 rounded-lg bg-yellow-100 p-4">
                      <svg
                        className="h-6 w-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-yellow-800">
                          Areas for Improvement
                        </h4>
                        <p className="text-yellow-700">
                          Consider additional training or practice in core
                          cognitive skills.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personality' && personalityData.length > 0 && (
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Personality Profile
              </h2>

              {/* Radar Chart */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Dimension Overview
                </h3>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={personalityData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis domain={[0, 5]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Detailed Scores
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personalityBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interpretations */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Score Interpretations
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {personalityBarData.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          {item.name}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getInterpretationColor(item.score)}`}
                        >
                          {item.interpretation}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(item.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {item.score.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Details */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Question Responses
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Question
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Dimension
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Response
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {personalityQuestions.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.question}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.dimension}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: item.selectedAnswer,
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                item.weight >= 4
                                  ? 'bg-green-100 text-green-800'
                                  : item.weight >= 3
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.weight >= 2
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.weight}/5
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combined' && personalityData.length > 0 && (
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Combined Analysis
              </h2>

              {/* Scatter Plot */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Cognitive vs Personality Dimensions
                </h3>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="cognitive"
                        name="Cognitive Score (%)"
                        domain={[0, 100]}
                      />
                      <YAxis
                        type="number"
                        dataKey="personality"
                        name="Personality Score"
                        domain={[0, 5]}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-white p-3 shadow-lg">
                                <p className="font-semibold">
                                  {data.dimension}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Cognitive: {data.cognitive.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">
                                  Personality: {data.personality.toFixed(1)}/5
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter data={combinedData} fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  Key Insights
                </h3>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        insight.type === 'strength'
                          ? 'border border-green-200 bg-green-50'
                          : insight.type === 'development'
                            ? 'border border-orange-200 bg-orange-50'
                            : 'border border-blue-200 bg-blue-50'
                      }`}
                    >
                      <h4
                        className={`mb-2 font-semibold ${
                          insight.type === 'strength'
                            ? 'text-green-800'
                            : insight.type === 'development'
                              ? 'text-orange-800'
                              : 'text-blue-800'
                        }`}
                      >
                        {insight.title}
                      </h4>
                      <p
                        className={`${
                          insight.type === 'strength'
                            ? 'text-green-700'
                            : insight.type === 'development'
                              ? 'text-orange-700'
                              : 'text-blue-700'
                        }`}
                      >
                        {insight.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="mt-8 rounded-lg bg-gray-50 p-6">
                  <h4 className="mb-4 text-lg font-semibold text-gray-900">
                    Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {cognitivePercentage >= 80 &&
                      personalityData.some((p) => p.score >= 4.0) && (
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600">•</span>
                          <span>
                            Excellent combination of cognitive ability and
                            personality strengths - ideal for leadership roles
                          </span>
                        </li>
                      )}
                    {cognitivePercentage >= 70 &&
                      personalityData.some((p) => p.score <= 2.5) && (
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">•</span>
                          <span>
                            Strong cognitive performance paired with personality
                            development opportunities
                          </span>
                        </li>
                      )}
                    {cognitivePercentage < 70 &&
                      personalityData.some((p) => p.score >= 4.0) && (
                        <li className="flex items-start space-x-2">
                          <span className="text-orange-600">•</span>
                          <span>
                            Strong personality traits can complement cognitive
                            skill development
                          </span>
                        </li>
                      )}
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-600">•</span>
                      <span>
                        Consider role assignments that leverage identified
                        strengths
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-600">•</span>
                      <span>
                        Provide targeted development in areas showing lower
                        scores
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
