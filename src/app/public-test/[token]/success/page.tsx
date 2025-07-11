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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Test Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your test has been submitted and is being processed.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Submission Confirmed</span>
          </div>
          <p className="text-green-700 text-sm">
            Your answers have been saved and our team will review your submission.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Status</span>
            <span className="text-green-600 font-medium">✓ Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Submitted At</span>
            <span className="text-gray-800 font-medium">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">What's Next?</span>
          </div>
          <p className="text-blue-700 text-sm">
            You will receive an email confirmation shortly. Our team will review your submission and contact you within 2-3 business days.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            This window will close automatically in {countdown} seconds
          </p>
          <button
            onClick={() => window.close()}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Close Window
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
