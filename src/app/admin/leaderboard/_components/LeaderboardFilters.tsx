'use client';

import { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface LeaderboardFiltersProps {
  filters: {
    dateFrom?: string;
    dateTo?: string;
    invitationId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: Record<string, string | undefined>) => void;
}

export default function LeaderboardFilters({
  filters,
  onFilterChange,
}: LeaderboardFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch || undefined, page: '1' });
  };

  const handleDateChange = (type: 'dateFrom' | 'dateTo', value: string) => {
    onFilterChange({ [type]: value || undefined, page: '1' });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      invitationId: undefined,
      page: '1',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.invitationId;

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 shadow">
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
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

            {/* Invitation ID */}
            <div>
              <label
                htmlFor="invitationId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Invitation ID
              </label>
              <input
                type="text"
                id="invitationId"
                placeholder="Filter by invitation ID..."
                value={filters.invitationId || ''}
                onChange={(e) =>
                  onFilterChange({
                    invitationId: e.target.value || undefined,
                    page: '1',
                  })
                }
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

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
                onClick={clearAllFilters}
                className="text-sm text-blue-600 underline hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500">Total Candidates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500">Top Performer</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500">This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
