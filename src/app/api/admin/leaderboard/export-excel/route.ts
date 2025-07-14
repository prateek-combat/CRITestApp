import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as xlsx from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch leaderboard data in chunks due to API limit
    const allRows: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    const maxPageSize = 100; // API limit

    // Clone the URL to modify it
    const leaderboardUrl = new URL(request.url);
    leaderboardUrl.pathname = '/api/admin/leaderboard';

    // Fetch data page by page - ALL data
    while (hasMore) {
      leaderboardUrl.searchParams.set('pageSize', maxPageSize.toString());
      leaderboardUrl.searchParams.set('page', currentPage.toString());

      const response = await fetch(leaderboardUrl.toString(), {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();

      // Add all rows from this page
      allRows.push(...data.rows);

      hasMore = data.pagination.hasNext;
      currentPage++;

      // Safety limit to prevent infinite loops (1000 pages = 100,000 records max)
      if (currentPage > 1000) {
        console.warn(
          'Reached maximum page limit while fetching leaderboard data'
        );
        break;
      }
    }

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();

    // Format data for Excel
    const excelData = allRows.map((row) => ({
      Rank: row.rank,
      'Candidate Name': row.candidateName,
      Email: row.candidateEmail,
      'Score (%)': parseFloat(row.composite.toFixed(2)),
      'Logical (%)': parseFloat(row.scoreLogical.toFixed(2)),
      'Verbal (%)': parseFloat(row.scoreVerbal.toFixed(2)),
      'Numerical (%)': parseFloat(row.scoreNumerical.toFixed(2)),
      'Attention (%)': parseFloat(row.scoreAttention.toFixed(2)),
      'Other (%)': parseFloat(row.scoreOther.toFixed(2)),
      Percentile: row.percentile,
      'Risk Score': row.riskScore !== null ? row.riskScore : 'N/A',
      Proctoring: row.proctoringEnabled ? 'Yes' : 'No',
      'Completed At': new Date(row.completedAt).toLocaleString(),
      'Duration (seconds)': row.durationSeconds,
      Type: row.type === 'public' ? 'Public Link' : 'Invitation',
    }));

    // Create worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Auto-size columns
    const maxWidth = 50;
    const colInfo: any[] = [];

    if (excelData.length > 0) {
      Object.keys(excelData[0]).forEach((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...excelData.map((row) => String(row[key as keyof typeof row]).length)
        );
        colInfo.push({ width: Math.min(maxLength + 2, maxWidth) });
      });
    }

    worksheet['!cols'] = colInfo;

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');

    // Generate Excel buffer
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=\"leaderboard_export_${new Date().toISOString().split('T')[0]}.xlsx\"`,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard data for Excel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
