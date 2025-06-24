'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Briefcase } from 'lucide-react';

interface Test {
  id: string;
  title: string;
}

interface JobProfile {
  id: string;
  name: string;
  testWeights: Array<{
    test: {
      id: string;
      title: string;
    };
    weight: number;
  }>;
}

interface LeaderboardFiltersProps {
  filters: {
    dateFrom?: string;
    dateTo?: string;
    invitationId?: string;
    testId?: string;
    jobProfileId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  stats?: {
    totalCandidates: number;
    avgScore: number;
    topScore: number;
    thisMonth: number;
  };
}

export default function LeaderboardFilters({
  filters,
  onFilterChange,
  stats,
}: LeaderboardFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [viewMode, setViewMode] = useState<'test' | 'jobProfile'>(
    filters.jobProfileId ? 'jobProfile' : 'test'
  );

  useEffect(() => {
    fetchTests();
    fetchJobProfiles();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchJobProfiles = async () => {
    try {
      const response = await fetch('/api/admin/job-profiles');
      if (response.ok) {
        const data = await response.json();
        // Filter job profiles that have tests
        const profilesWithTests = data.filter(
          (profile: JobProfile) =>
            profile.testWeights && profile.testWeights.length > 0
        );
        setJobProfiles(profilesWithTests);
      }
    } catch (error) {
      console.error('Error fetching job profiles:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch || undefined, page: '1' });
  };

  const handleDateChange = (type: 'dateFrom' | 'dateTo', value: string) => {
    onFilterChange({ [type]: value || undefined, page: '1' });
  };

  const handleViewModeChange = (mode: 'test' | 'jobProfile') => {
    setViewMode(mode);
    // Clear the opposite filter when switching modes
    if (mode === 'test') {
      onFilterChange({
        jobProfileId: undefined,
        testId: filters.testId,
        page: '1',
      });
    } else {
      onFilterChange({
        testId: undefined,
        jobProfileId: filters.jobProfileId,
        page: '1',
      });
    }
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      invitationId: undefined,
      testId: undefined,
      jobProfileId: undefined,
      page: '1',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.invitationId ||
    filters.testId ||
    filters.jobProfileId;

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 shadow">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <span className="text-sm font-medium text-gray-700">View Mode:</span>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => handleViewModeChange('test')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'test'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Individual Tests
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('jobProfile')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'jobProfile'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="mr-1 inline h-4 w-4" />
            Job Profiles
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </form>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Date From */}
            <div>
              <label
                htmlFor="dateFrom"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Completed From
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dateFrom"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label
                htmlFor="dateTo"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Completed To
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dateTo"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleDateChange('dateTo', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Test or Job Profile Filter */}
            <div>
              <label
                htmlFor={viewMode === 'test' ? 'testId' : 'jobProfileId'}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {viewMode === 'test' ? 'Test' : 'Job Profile'}
              </label>
              <select
                id={viewMode === 'test' ? 'testId' : 'jobProfileId'}
                value={
                  viewMode === 'test'
                    ? filters.testId || ''
                    : filters.jobProfileId || ''
                }
                onChange={(e) =>
                  onFilterChange({
                    [viewMode === 'test' ? 'testId' : 'jobProfileId']:
                      e.target.value || undefined,
                    page: '1',
                  })
                }
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 leading-5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  {viewMode === 'test' ? 'All Tests' : 'All Job Profiles'}
                </option>
                {viewMode === 'test'
                  ? tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))
                  : jobProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} ({profile.testWeights.length} test
                        {profile.testWeights.length !== 1 ? 's' : ''})
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Show selected job profile tests */}
          {viewMode === 'jobProfile' && filters.jobProfileId && (
            <div className="rounded-md bg-blue-50 p-3">
              <h4 className="mb-2 text-sm font-medium text-blue-900">
                Tests in Selected Job Profile:
              </h4>
              {(() => {
                const selectedProfile = jobProfiles.find(
                  (p) => p.id === filters.jobProfileId
                );
                if (!selectedProfile)
                  return <p className="text-sm text-blue-700">Loading...</p>;

                return (
                  <div className="space-y-1">
                    {selectedProfile.testWeights.map((tw) => (
                      <div
                        key={tw.test.id}
                        className="flex justify-between text-sm text-blue-700"
                      >
                        <span>{tw.test.title}</span>
                        <span className="font-medium">Weight: {tw.weight}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              {hasActiveFilters ? (
                <span>Active filters applied</span>
              ) : (
                <span>No filters applied</span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalCandidates}
            </div>
            <div className="text-sm text-gray-500">Total Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.avgScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.topScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Top Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.thisMonth}
            </div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
        </div>
      )}
    </div>
  );
}
