'use client';

import { useState, useEffect } from 'react';

interface VerticalTimerProps {
  questionKey: string;
  startTimeEpoch: number;
  durationSeconds: number;
  onTimeExpired: () => void;
}

export default function VerticalTimer({
  questionKey,
  startTimeEpoch,
  durationSeconds,
  onTimeExpired,
}: VerticalTimerProps) {
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
    progressBarColor = 'bg-orange-500';
    textColor = 'text-orange-700';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
  }

  const formatTime = (minutes: number, seconds: number) => {
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  };

  const { minutes: formattedMinutes, seconds: formattedSeconds } = formatTime(
    minutes,
    seconds
  );

  return (
    <div className={`flex h-full flex-col ${pulseAnimation}`}>
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-2 flex items-center justify-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${progressBarColor}`}></div>
          <span className="text-sm font-medium text-gray-600">Time Left</span>
        </div>
      </div>

      {/* Vertical Time Display - Dropping Effect */}
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        {/* Minutes */}
        <div className="text-center">
          <div
            className={`font-mono text-4xl font-bold ${textColor} ${bgColor} rounded-lg border px-3 py-2 ${borderColor}`}
          >
            {formattedMinutes}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500">MIN</div>
        </div>

        {/* Separator */}
        <div className="flex flex-col items-center space-y-1">
          <div className={`h-1 w-1 rounded-full ${progressBarColor}`}></div>
          <div
            className={`h-1 w-1 rounded-full ${progressBarColor} opacity-60`}
          ></div>
          <div
            className={`h-1 w-1 rounded-full ${progressBarColor} opacity-30`}
          ></div>
        </div>

        {/* Seconds */}
        <div className="text-center">
          <div
            className={`font-mono text-4xl font-bold ${textColor} ${bgColor} rounded-lg border px-3 py-2 ${borderColor}`}
          >
            {formattedSeconds}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500">SEC</div>
        </div>
      </div>

      {/* Vertical Progress Bar */}
      <div className="mt-4 flex justify-center">
        <div className="h-48 w-3 overflow-hidden rounded-full bg-gray-200 shadow-inner">
          <div
            className={`w-full transition-all duration-1000 ease-linear ${progressBarColor} rounded-full shadow-sm`}
            style={{
              height: `${progressPercentage}%`,
              transform: `translateY(${100 - progressPercentage}%)`,
              transition: 'height 1s ease-linear, transform 1s ease-linear',
            }}
          />
        </div>
      </div>

      {/* Warning Messages */}
      <div className="mt-4 text-center">
        {progressPercentage < 25 && (
          <div className="flex items-center justify-center space-x-2">
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
            <span className="text-xs font-medium text-red-600">Hurry up!</span>
          </div>
        )}

        {progressPercentage < 50 && progressPercentage >= 25 && (
          <div className="text-center">
            <span className="text-xs font-medium text-orange-600">
              Half time left
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
