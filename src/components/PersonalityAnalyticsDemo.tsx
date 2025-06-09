'use client';

import React from 'react';
import Link from 'next/link';

export default function PersonalityAnalyticsDemo() {
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          🧠 Personality Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive personality assessment analytics for administrators
        </p>
      </div>

      {/* Key Features */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-blue-50 p-6">
          <h3 className="mb-3 text-xl font-semibold text-blue-900">
            📊 Dimension Analytics
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Average scores per personality dimension</li>
            <li>• Distribution curves and percentile analysis</li>
            <li>• Sample size and test coverage statistics</li>
            <li>• Visual charts and interactive graphs</li>
          </ul>
        </div>

        <div className="rounded-lg bg-green-50 p-6">
          <h3 className="mb-3 text-xl font-semibold text-green-900">
            🔍 Advanced Filtering
          </h3>
          <ul className="space-y-2 text-green-800">
            <li>• Filter by date range</li>
            <li>• Filter by specific tests</li>
            <li>• Invitation vs public link analysis</li>
            <li>• Cognitive score range filtering</li>
          </ul>
        </div>

        <div className="rounded-lg bg-purple-50 p-6">
          <h3 className="mb-3 text-xl font-semibold text-purple-900">
            🔗 Correlation Analysis
          </h3>
          <ul className="space-y-2 text-purple-800">
            <li>• Pearson correlation matrix between dimensions</li>
            <li>• Statistical significance indicators</li>
            <li>• Correlation strength categorization</li>
            <li>• Interactive correlation tables</li>
          </ul>
        </div>

        <div className="rounded-lg bg-orange-50 p-6">
          <h3 className="mb-3 text-xl font-semibold text-orange-900">
            📈 Comparative Analysis
          </h3>
          <ul className="space-y-2 text-orange-800">
            <li>• High vs low cognitive performance comparison</li>
            <li>• Time-based trend analysis</li>
            <li>• Dimension popularity metrics</li>
            <li>• Performance impact insights</li>
          </ul>
        </div>
      </div>

      {/* Analytics Views */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Analytics Views
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-2xl">📊</div>
            <div className="font-medium text-gray-900">Overview</div>
            <div className="text-sm text-gray-600">
              Summary charts and key metrics
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-2xl">📋</div>
            <div className="font-medium text-gray-900">Dimensions</div>
            <div className="text-sm text-gray-600">
              Detailed dimension analysis
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-2xl">🔗</div>
            <div className="font-medium text-gray-900">Correlations</div>
            <div className="text-sm text-gray-600">
              Inter-dimension relationships
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-2xl">📈</div>
            <div className="font-medium text-gray-900">Trends</div>
            <div className="text-sm text-gray-600">Time-based patterns</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-2xl">⚖️</div>
            <div className="font-medium text-gray-900">Comparison</div>
            <div className="text-sm text-gray-600">
              Cognitive vs personality
            </div>
          </div>
        </div>
      </div>

      {/* Export Features */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Export & Integration
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <h4 className="mb-2 font-semibold text-green-900">📄 CSV Export</h4>
            <p className="text-sm text-green-800">
              Download raw personality data with all dimensions, cognitive
              scores, and metadata for external analysis.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">🔌 API Access</h4>
            <p className="text-sm text-blue-800">
              RESTful API endpoints for integrating personality analytics into
              external systems and dashboards.
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <h4 className="mb-2 font-semibold text-purple-900">
              📊 Real-time Data
            </h4>
            <p className="text-sm text-purple-800">
              Live analytics that update automatically as new personality
              assessments are completed.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Technical Capabilities
        </h2>
        <div className="rounded-lg bg-gray-50 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold text-gray-900">
                Performance Optimized
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Efficient database queries with proper indexing</li>
                <li>• Pagination for large datasets</li>
                <li>• Caching for frequently accessed analytics</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-gray-900">
                Statistical Analysis
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Pearson correlation coefficient calculations</li>
                <li>• Distribution analysis and percentiles</li>
                <li>• Statistical significance testing</li>
                <li>• Trend analysis with time series data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Access Information */}
      <div className="mb-6 rounded-lg bg-blue-50 p-6">
        <h2 className="mb-3 text-xl font-bold text-blue-900">How to Access</h2>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start space-x-3">
            <span className="font-semibold">1.</span>
            <div>
              <strong>From Admin Analytics:</strong> Click the &quot;🧠
              Personality Analytics&quot; button in the main analytics dashboard
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="font-semibold">2.</span>
            <div>
              <strong>Direct URL:</strong> Navigate to{' '}
              <code className="rounded bg-blue-100 px-2 py-1">
                /admin/analytics/personality
              </code>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="font-semibold">3.</span>
            <div>
              <strong>API Endpoint:</strong>{' '}
              <code className="rounded bg-blue-100 px-2 py-1">
                /api/admin/analytics/personality
              </code>{' '}
              for programmatic access
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-x-4 text-center">
        <Link
          href="/admin/analytics/personality"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          🧠 Open Personality Analytics
        </Link>
        <Link
          href="/admin/analytics"
          className="inline-block rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
        >
          📊 Back to Main Analytics
        </Link>
      </div>

      {/* Footer Note */}
      <div className="mt-8 rounded-lg bg-yellow-50 p-4">
        <p className="text-center text-sm text-yellow-800">
          <strong>Note:</strong> Personality analytics requires completed test
          attempts with personality assessment data. The system automatically
          adapts to available data and provides meaningful insights even with
          limited samples.
        </p>
      </div>
    </div>
  );
}
