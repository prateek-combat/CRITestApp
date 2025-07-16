'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';

export default function TestSuccessPage() {
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to a generic page or close the window
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-6">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            Test Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your test has been submitted and is being processed.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-2 flex items-center justify-center">
            <FileText className="mr-2 h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              Submission Confirmed
            </span>
          </div>
          <p className="text-sm text-green-700">
            Your answers have been saved and our team will review your
            submission.
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-green-600">✓ Completed</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-gray-600">Submitted At</span>
            <span className="font-medium text-gray-800">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">What&apos;s Next?</span>
          </div>
          <p className="text-sm text-blue-700">
            You will receive an email confirmation shortly. Our team will review
            your submission and contact you within 2-3 business days.
          </p>
        </div>

        <div className="text-center">
          <p className="mb-4 text-sm text-gray-500">
            This window will close automatically in {countdown} seconds
          </p>
          <button
            onClick={() => window.close()}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            Close Window
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
