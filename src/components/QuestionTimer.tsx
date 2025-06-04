'use client';

import { useState, useEffect } from 'react';

interface QuestionTimerProps {
  questionKey: string; // Renamed from key to avoid conflict with React's special key prop, and to be explicit
  startTimeEpoch: number; // Epoch time when the question was started/displayed
  durationSeconds: number; // Total duration for this question's timer
  onTimeExpired: () => void; // Callback when timer reaches zero
}

export default function QuestionTimer({
  questionKey,
  startTimeEpoch,
  durationSeconds,
  onTimeExpired,
}: QuestionTimerProps) {
  const [remainingTime, setRemainingTime] = useState(durationSeconds);

  useEffect(() => {
    if (startTimeEpoch === 0 || durationSeconds <= 0) {
      setRemainingTime(durationSeconds);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeEpoch) / 1000);
      return Math.max(0, durationSeconds - elapsedSeconds);
    };

    // Reset timer for new question
    const newRemainingTime = calculateRemaining();
    setRemainingTime(newRemainingTime);

    // Clear any existing interval first
    const intervalId = setInterval(() => {
      const currentRemaining = calculateRemaining();
      setRemainingTime(currentRemaining);
      if (currentRemaining <= 0) {
        clearInterval(intervalId);
        onTimeExpired();
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // Using questionKey in dependency array to reset timer when it changes (i.e., new question)
  }, [questionKey, startTimeEpoch, durationSeconds, onTimeExpired]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progressPercentage =
    durationSeconds > 0 ? (remainingTime / durationSeconds) * 100 : 0;

  // Determine color and urgency based on remaining time
  let progressBarColor = 'bg-brand-500';
  let textColor = 'text-gray-700';
  let bgColor = 'bg-gray-50';
  let borderColor = 'border-gray-200';
  let pulseAnimation = '';

  if (progressPercentage < 25) {
    progressBarColor = 'bg-red-500';
    textColor = 'text-red-700';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    pulseAnimation = 'animate-pulse';
  } else if (progressPercentage < 50) {
    progressBarColor = 'bg-accent-orange';
    textColor = 'text-orange-700';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
  }

  const formatTime = (minutes: number, seconds: number) => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div
      className={`w-full rounded-xl ${bgColor} border ${borderColor} p-4 shadow-sm transition-all duration-300 ${pulseAnimation}`}
    >
      {/* Timer Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${progressBarColor}`}></div>
          <span className="text-sm font-medium text-gray-600">
            Time Remaining
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <svg
            className={`h-5 w-5 ${textColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className={`font-mono text-2xl font-bold ${textColor}`}>
            {formatTime(minutes, seconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${progressBarColor} shadow-sm`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Progress indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[25, 50, 75].map((marker) => (
            <div
              key={marker}
              className="h-5 w-0.5 rounded-full bg-white/30"
              style={{ marginLeft: `${marker - 2}%` }}
            />
          ))}
        </div>
      </div>

      {/* Warning Messages */}
      {progressPercentage < 25 && (
        <div className="mt-3 flex items-center justify-center space-x-2">
          <svg
            className="h-4 w-4 text-red-500"
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
          <span className="text-sm font-medium text-red-600">
            Time running out!
          </span>
        </div>
      )}

      {progressPercentage < 50 && progressPercentage >= 25 && (
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-orange-600">
            Less than half time remaining
          </span>
        </div>
      )}
    </div>
  );
}
