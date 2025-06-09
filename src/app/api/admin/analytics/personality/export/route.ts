import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const testIds = searchParams.get('testIds');
    const invitationType = searchParams.get('invitationType');
    const minCognitive = searchParams.get('minCognitive');
    const maxCognitive = searchParams.get('maxCognitive');

    // Build base query conditions
    const whereConditions: any = {
      status: 'COMPLETED',
      personalityScores: {
        not: null,
      },
    };

    // Apply filters
    if (startDate && endDate) {
      whereConditions.completedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (testIds) {
      whereConditions.testId = {
        in: testIds.split(','),
      };
    }

    if (invitationType && invitationType !== 'all') {
      if (invitationType === 'invitation') {
        whereConditions.invitationId = { not: null };
      } else if (invitationType === 'public') {
        whereConditions.invitationId = null;
      }
    }

    // Fetch test attempts with personality data
    const testAttempts = await prisma.testAttempt.findMany({
      where: whereConditions,
      include: {
        test: {
          include: {
            questions: {
              include: {
                personalityDimension: true,
              },
            },
          },
        },
        invitation: {
          include: {
            createdBy: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Process raw data for CSV export
    const csvData: Array<Record<string, any>> = [];

    testAttempts.forEach((attempt: any) => {
      if (attempt.personalityScores) {
        const personalityScores = attempt.personalityScores as Record<
          string,
          number
        >;
        const totalQuestions = attempt.test.questions.length;
        const cognitivePercentage =
          totalQuestions > 0
            ? ((attempt.rawScore || 0) / totalQuestions) * 100
            : 0;

        // Apply cognitive score filter if specified
        if (minCognitive && maxCognitive) {
          const min = parseFloat(minCognitive);
          const max = parseFloat(maxCognitive);
          if (cognitivePercentage < min || cognitivePercentage > max) {
            return; // Skip this attempt
          }
        }

        const baseRow: Record<string, any> = {
          attemptId: attempt.id,
          candidateName: attempt.candidateName || 'N/A',
          candidateEmail: attempt.candidateEmail || 'N/A',
          testTitle: attempt.test.title || 'Unknown Test',
          completedAt: attempt.completedAt?.toISOString() || '',
          cognitiveScore: attempt.rawScore || 0,
          cognitivePercentage: Math.round(cognitivePercentage * 100) / 100,
          invitationType: attempt.invitationId ? 'invitation' : 'public',
          createdBy: attempt.invitation?.createdBy
            ? `${attempt.invitation.createdBy.firstName} ${attempt.invitation.createdBy.lastName} (${attempt.invitation.createdBy.email})`
            : 'Public Link',
        };

        // Add personality scores as columns
        Object.entries(personalityScores).forEach(([dimensionCode, score]) => {
          const dimension = attempt.test.questions.find(
            (q: any) => q.personalityDimension?.code === dimensionCode
          )?.personalityDimension;

          if (dimension) {
            const columnName = `${dimension.name} (${dimensionCode})`;
            baseRow[columnName] = Number(score);
          }
        });

        csvData.push(baseRow);
      }
    });

    // Generate CSV content
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No data available for export' },
        { status: 404 }
      );
    }

    // Get all unique column names
    const allColumns = new Set<string>();
    csvData.forEach((row) => {
      Object.keys(row).forEach((key) => allColumns.add(key));
    });

    const columns = Array.from(allColumns);

    // Create CSV header
    const csvHeader = columns.join(',');

    // Create CSV rows
    const csvRows = csvData.map((row) => {
      return columns
        .map((column) => {
          const value = row[column];
          // Escape commas and quotes in values
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Set appropriate headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set(
      'Content-Disposition',
      `attachment; filename="personality-analytics-${new Date().toISOString().split('T')[0]}.csv"`
    );

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error exporting personality analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export personality analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
