'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ProctorEvent {
  id: string;
  type: string;
  ts: Date;
  extra?: any;
}

interface ProctorAsset {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  ts: Date;
  data: Buffer;
}

interface TestAttempt {
  id: string;
  candidateName: string;
  candidateEmail: string;
  startedAt: Date;
  completedAt: Date;
  status: string;
  rawScore: number;
  percentile: number;
  tabSwitches: number;
  proctoringEnabled: boolean;
  videoRecordingUrl: string | null;
  riskScore: number | null;
  proctoringStartedAt: Date | null;
  proctoringEndedAt: Date | null;
  test: {
    id: string;
    title: string;
    questions?: Array<{
      id: string;
      promptText: string;
      promptImageUrl: string | null;
      answerOptions: string[];
      correctAnswerIndex: number;
      category: string;
    }>;
  };
  invitation: {
    id: string;
    candidateName: string;
    candidateEmail: string;
  };
  submittedAnswers?: Array<{
    id: string;
    questionId: string;
    selectedAnswerIndex: number | null;
    isCorrect: boolean | null;
    timeTakenSeconds: number;
    submittedAt: Date;
    question: {
      id: string;
      promptText: string;
    };
  }>;
}

interface AnalysisData {
  testAttempt: TestAttempt;
  proctorEvents: ProctorEvent[];
  proctorAssets: ProctorAsset[];
  analysisResults?: {
    faceDetection?: {
      totalFrames: number;
      framesWithFace: number;
      faceDetectionRate: number;
      multipleFacesDetected: number;
      noFaceDetectedPeriods: Array<{
        start: string;
        end: string;
        reason: string;
      }>;
      averageConfidence: number;
    };
    objectDetection?: {
      phoneDetected: boolean;
      bookDetected: boolean;
      paperDetected: boolean;
      suspiciousObjects: any[];
      detectionConfidence: number;
    };
    audioAnalysis?: {
      totalDuration: number;
      silencePercentage: number;
      backgroundNoiseLevel: string;
      speechDetected: boolean;
      suspiciousAudioEvents: any[];
    };
    riskAssessment?: {
      overallRiskScore: number;
      factors: Array<{ factor: string; score: number; weight: number }>;
      recommendations: string[];
    };
  };
}

export default function ProctorAnalysisPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AnalysisData | null>(null);
  const [questionsData, setQuestionsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'video' | 'events' | 'analysis' | 'questions'
  >('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch proctoring data
        const response = await fetch(
          `/api/admin/proctor/analysis/${attemptId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch proctoring data');
        }
        const result = await response.json();
        setData(result);

        // Fetch questions and answers data separately
        try {
          const questionsResponse = await fetch(
            `/api/admin/test-analysis/${attemptId}`
          );
          if (questionsResponse.ok) {
            const questionsResult = await questionsResponse.json();
            setQuestionsData(questionsResult);
          }
        } catch (questionsErr) {
          // Non-critical error, questions tab will show fallback message
          console.warn('Failed to fetch questions data:', questionsErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchData();
    }
  }, [attemptId]);

  const formatDuration = (start: Date, end: Date) => {
    const duration = Math.floor(
      (new Date(end).getTime() - new Date(start).getTime()) / 1000
    );
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8)
      return { label: 'High Risk', color: 'text-red-600 bg-red-100' };
    if (score >= 5)
      return { label: 'Medium Risk', color: 'text-yellow-600 bg-yellow-100' };
    if (score >= 2)
      return { label: 'Low Risk', color: 'text-green-600 bg-green-100' };
    return { label: 'Minimal Risk', color: 'text-blue-600 bg-blue-100' };
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TAB_SWITCH':
        return '🔄';
      case 'WINDOW_FOCUS_LOST':
        return '👁️‍🗨️';
      case 'DEVTOOLS_OPENED':
        return '🔧';
      case 'COPY_PASTE':
        return '📋';
      case 'SUSPICIOUS_BEHAVIOR':
        return '⚠️';
      case 'FACE_NOT_DETECTED':
        return '👤';
      case 'MULTIPLE_FACES':
        return '👥';
      case 'PHONE_DETECTED':
        return '📱';
      case 'BOOK_DETECTED':
        return '📚';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-military-green"></div>
          <p className="text-text-light">Loading proctoring analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="text-text-light">{error || 'No data found'}</p>
          <Link
            href="/admin/analytics"
            className="mt-4 inline-block text-military-green hover:underline"
          >
            ← Back to Analytics
          </Link>
        </div>
      </div>
    );
  }

  const { testAttempt, proctorEvents, proctorAssets, analysisResults } = data;
  const riskInfo = getRiskLevel(testAttempt.riskScore || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Proctoring Analysis
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {testAttempt.test.title} - {testAttempt.candidateName}
              </p>
            </div>
            <Link
              href="/admin/analytics"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ← Back to Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'questions', label: 'Questions & Answers' },
              { id: 'video', label: 'Captured Frames' },
              { id: 'events', label: 'Proctoring Events' },
              { id: 'analysis', label: 'AI Analysis' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  selectedTab === tab.id
                    ? 'border-military-green text-military-green'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Test Information */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Test Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Candidate</dt>
                  <dd className="text-gray-900">{testAttempt.candidateName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Email</dt>
                  <dd className="text-gray-900">
                    {testAttempt.candidateEmail}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Test Duration</dt>
                  <dd className="text-gray-900">
                    {testAttempt.proctoringStartedAt &&
                    testAttempt.proctoringEndedAt
                      ? formatDuration(
                          testAttempt.proctoringStartedAt,
                          testAttempt.proctoringEndedAt
                        )
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Score</dt>
                  <dd className="text-gray-900">
                    {testAttempt.rawScore}% (Percentile:{' '}
                    {testAttempt.percentile})
                  </dd>
                </div>
              </dl>
            </div>

            {/* Risk Assessment */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Risk Assessment
              </h3>
              <div className="text-center">
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${riskInfo.color}`}
                >
                  {riskInfo.label}
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {testAttempt.riskScore || 0}/10
                </p>
                <p className="text-sm text-gray-500">Risk Score</p>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  <p>
                    Tab Switches:{' '}
                    <span className="font-medium">
                      {testAttempt.tabSwitches}
                    </span>
                  </p>
                  <p>
                    Proctoring Events:{' '}
                    <span className="font-medium">{proctorEvents.length}</span>
                  </p>
                  <p>
                    Recordings:{' '}
                    <span className="font-medium">{proctorAssets.length}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Quick Stats
              </h3>
              <div className="space-y-3">
                {proctorEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="mr-2">{getEventIcon(event.type)}</span>
                    <span className="text-gray-600">
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="ml-auto text-gray-400">
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {proctorEvents.length > 5 && (
                  <p className="text-sm text-gray-500">
                    +{proctorEvents.length - 5} more events...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'questions' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Questions & Answers
            </h3>
            {questionsData?.attempt?.test?.questions &&
            questionsData?.attempt?.submittedAnswers ? (
              <div className="space-y-6">
                {questionsData.attempt.test.questions.map(
                  (question: any, index: number) => {
                    const submittedAnswer =
                      questionsData.attempt.submittedAnswers?.find(
                        (answer: any) => answer.questionId === question.id
                      );
                    const isCorrect = submittedAnswer?.isCorrect || false;
                    const selectedAnswerIndex =
                      submittedAnswer?.selectedAnswerIndex;

                    return (
                      <div
                        key={question.id}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <h4 className="text-lg font-semibold text-gray-800">
                            Question {index + 1}
                          </h4>
                          <div
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                              isCorrect
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </div>
                        </div>

                        <div className="mb-4">
                          <MarkdownRenderer
                            content={question.promptText}
                            className="text-gray-700"
                          />
                        </div>

                        {question.promptImageUrl && (
                          <div className="mb-4">
                            <img
                              src={question.promptImageUrl}
                              alt="Question image"
                              className="max-w-md rounded-md"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">
                            Answer Options:
                          </p>
                          <ul className="space-y-2">
                            {question.answerOptions.map(
                              (option: string, optionIndex: number) => {
                                const isCorrectAnswer =
                                  optionIndex === question.correctAnswerIndex;
                                const isSelectedAnswer =
                                  optionIndex === selectedAnswerIndex;

                                return (
                                  <li
                                    key={optionIndex}
                                    className={`rounded-md p-3 text-sm ${
                                      isSelectedAnswer && isCorrectAnswer
                                        ? 'border border-green-300 bg-green-100' // Selected and correct
                                        : isSelectedAnswer && !isCorrectAnswer
                                          ? 'border border-red-300 bg-red-100' // Selected but wrong
                                          : isCorrectAnswer
                                            ? 'border border-green-200 bg-green-50' // Not selected but correct
                                            : 'border border-gray-200 bg-gray-50' // Not selected and not correct
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="flex-grow">
                                        {String.fromCharCode(65 + optionIndex)}.{' '}
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: option,
                                          }}
                                        />
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        {isSelectedAnswer && (
                                          <span className="font-medium text-blue-600">
                                            👤 Selected
                                          </span>
                                        )}
                                        {isCorrectAnswer && (
                                          <span className="font-medium text-green-600">
                                            ✓ Correct
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </div>

                        {submittedAnswer && (
                          <div className="mt-4 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Time taken:</span>{' '}
                              {submittedAnswer.timeTakenSeconds} seconds
                            </p>
                            <p>
                              <span className="font-medium">Submitted at:</span>{' '}
                              {new Date(
                                submittedAnswer.submittedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <p className="text-gray-500">No question data available.</p>
            )}
          </div>
        )}

        {selectedTab === 'video' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Captured Frames
            </h3>
            {proctorAssets.length > 0 ? (
              <div className="space-y-6">
                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    📸 {proctorAssets.length} frames captured during test
                    session
                  </p>
                  <p>🕒 Captured at 2 FPS (one frame every 500ms)</p>
                  <p>
                    💾 Total size:{' '}
                    {(
                      proctorAssets.reduce(
                        (sum, asset) => sum + asset.fileSize,
                        0
                      ) /
                      1024 /
                      1024
                    ).toFixed(2)}{' '}
                    MB
                  </p>
                </div>

                {/* Frame Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {proctorAssets.map((asset, index) => (
                    <div
                      key={asset.id}
                      className="group relative overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                    >
                      <div className="relative aspect-video bg-gray-100">
                        <img
                          src={`/api/admin/proctor/stream/${asset.id}`}
                          alt={`Frame ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute left-2 top-2 rounded bg-black bg-opacity-60 px-2 py-1 text-xs text-white">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="p-2">
                        <p
                          className="truncate text-xs text-gray-600"
                          title={asset.fileName}
                        >
                          {asset.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(asset.ts).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(asset.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      {/* Hover overlay with download */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100">
                        <a
                          href={`/api/admin/proctor/download/${asset.id}`}
                          className="rounded bg-white px-3 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
                          download
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline View Toggle */}
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium text-gray-900">
                    Timeline View
                  </h4>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {proctorAssets.map((asset, index) => (
                      <div
                        key={asset.id}
                        className="flex items-center space-x-3 rounded p-2 hover:bg-gray-50"
                      >
                        <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          <img
                            src={`/api/admin/proctor/stream/${asset.id}`}
                            alt={`Frame ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Frame #{index + 1}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(asset.ts).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(asset.fileSize / 1024).toFixed(1)} KB
                        </div>
                        <a
                          href={`/api/admin/proctor/download/${asset.id}`}
                          className="hover:text-military-green-dark text-sm text-military-green"
                          download
                        >
                          ↓
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 text-6xl text-gray-400">📸</div>
                <p className="text-gray-500">
                  No frames captured during this test session.
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Frames are automatically captured when proctoring is enabled.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'events' && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Proctoring Events Timeline
              </h3>
            </div>
            <div className="divide-y">
              {proctorEvents.length > 0 ? (
                proctorEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <span className="mr-3 text-lg">
                        {getEventIcon(event.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.type.replace(/_/g, ' ')}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(event.ts).toLocaleString()}
                          </span>
                        </div>
                        {event.extra && (
                          <pre className="mt-2 rounded bg-gray-100 p-2 text-xs text-gray-600">
                            {JSON.stringify(event.extra, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No proctoring events recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'analysis' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                AI Analysis Results
              </h3>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await fetch(
                      `/api/admin/proctor/trigger-analysis/${attemptId}`,
                      {
                        method: 'POST',
                      }
                    );
                    if (response.ok) {
                      // Reload data to get the analysis results
                      const dataResponse = await fetch(
                        `/api/admin/proctor/analysis/${attemptId}`
                      );
                      if (dataResponse.ok) {
                        const result = await dataResponse.json();
                        setData(result);
                      }
                    }
                  } catch (error) {
                    console.error('Failed to trigger analysis:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="rounded-md bg-military-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading
                  ? 'Analyzing...'
                  : analysisResults
                    ? 'Re-run AI Analysis'
                    : 'Run AI Analysis'}
              </button>
            </div>
            {analysisResults ? (
              <div className="space-y-6">
                {analysisResults.faceDetection && (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">
                      Face Detection
                    </h4>
                    <div className="rounded bg-gray-100 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Detection Rate:</span>{' '}
                          {analysisResults.faceDetection.faceDetectionRate}%
                        </div>
                        <div>
                          <span className="font-medium">Frames with Face:</span>{' '}
                          {analysisResults.faceDetection.framesWithFace}/
                          {analysisResults.faceDetection.totalFrames}
                        </div>
                        <div>
                          <span className="font-medium">Multiple Faces:</span>{' '}
                          {analysisResults.faceDetection.multipleFacesDetected}{' '}
                          instances
                        </div>
                        <div>
                          <span className="font-medium">Avg Confidence:</span>{' '}
                          {(
                            analysisResults.faceDetection.averageConfidence *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      {analysisResults.faceDetection.noFaceDetectedPeriods
                        ?.length > 0 && (
                        <div className="mt-4">
                          <h5 className="mb-2 text-sm font-medium">
                            Periods without face detection:
                          </h5>
                          <ul className="space-y-1 text-sm">
                            {analysisResults.faceDetection.noFaceDetectedPeriods.map(
                              (period, index) => (
                                <li key={index} className="text-yellow-700">
                                  {period.start} - {period.end}: {period.reason}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {analysisResults.objectDetection && (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">
                      Object Detection
                    </h4>
                    <div className="rounded bg-gray-100 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Phone Detected:</span>{' '}
                          {analysisResults.objectDetection.phoneDetected
                            ? '⚠️ Yes'
                            : '✅ No'}
                        </div>
                        <div>
                          <span className="font-medium">Books Detected:</span>{' '}
                          {analysisResults.objectDetection.bookDetected
                            ? '⚠️ Yes'
                            : '✅ No'}
                        </div>
                        <div>
                          <span className="font-medium">Paper Detected:</span>{' '}
                          {analysisResults.objectDetection.paperDetected
                            ? '📄 Yes'
                            : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">
                            Detection Confidence:
                          </span>{' '}
                          {(
                            analysisResults.objectDetection
                              .detectionConfidence * 100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {analysisResults.audioAnalysis && (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">
                      Audio Analysis
                    </h4>
                    <div className="rounded bg-gray-100 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Duration:</span>{' '}
                          {Math.floor(
                            analysisResults.audioAnalysis.totalDuration / 60
                          )}
                          m {analysisResults.audioAnalysis.totalDuration % 60}s
                        </div>
                        <div>
                          <span className="font-medium">Silence:</span>{' '}
                          {analysisResults.audioAnalysis.silencePercentage}%
                        </div>
                        <div>
                          <span className="font-medium">Background Noise:</span>{' '}
                          {analysisResults.audioAnalysis.backgroundNoiseLevel}
                        </div>
                        <div>
                          <span className="font-medium">Speech Detected:</span>{' '}
                          {analysisResults.audioAnalysis.speechDetected
                            ? '⚠️ Yes'
                            : '✅ No'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {analysisResults.riskAssessment && (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">
                      Risk Assessment
                    </h4>
                    <div className="rounded bg-gray-100 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-lg font-medium">
                          Overall Risk Score:
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            analysisResults.riskAssessment.overallRiskScore >= 8
                              ? 'text-red-600'
                              : analysisResults.riskAssessment
                                    .overallRiskScore >= 5
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}
                        >
                          {analysisResults.riskAssessment.overallRiskScore.toFixed(
                            1
                          )}
                          /10
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <h5 className="font-medium">Risk Factors:</h5>
                        {analysisResults.riskAssessment.factors.map(
                          (factor, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{factor.factor}:</span>
                              <span>
                                {factor.score} (weight: {factor.weight})
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      {analysisResults.riskAssessment.recommendations && (
                        <div className="mt-4">
                          <h5 className="mb-2 text-sm font-medium">
                            Recommendations:
                          </h5>
                          <ul className="space-y-1 text-sm">
                            {analysisResults.riskAssessment.recommendations.map(
                              (rec, index) => (
                                <li key={index} className="text-gray-700">
                                  • {rec}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-2 text-blue-600">🤖</div>
                <p className="text-gray-600">No AI analysis available yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Click &quot;Run AI Analysis&quot; to generate detailed
                  analysis results.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
