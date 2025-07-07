import { prisma } from '../src/lib/prisma';

// Risk score calculation logic (same as in the analysis page)
const calculateRiskScore = (events: any[]): number => {
  const counts = {
    copyCount: events.filter((e) => e.type === 'COPY_DETECTED').length,
    pasteCount: events.filter((e) => e.type === 'PASTE_DETECTED').length,
    tabHiddenCount: events.filter((e) => e.type === 'TAB_HIDDEN').length,
    windowBlurCount: events.filter((e) => e.type === 'WINDOW_BLUR').length,
    contextMenuCount: events.filter((e) => e.type === 'CONTEXT_MENU_DETECTED')
      .length,
    // High-risk events
    phoneDetected: events.some((e) => e.type === 'PHONE_DETECTED'),
    multiplePeople: events.some((e) => e.type === 'MULTIPLE_PEOPLE'),
  };

  let score = 0;

  // Base scoring
  if (counts.copyCount > 1) score += 2;
  if (counts.pasteCount > 0) score += 1.5;
  if (counts.tabHiddenCount > 3) score += 2;
  if (counts.windowBlurCount > 1) score += 1.5;

  // Medium risk threshold check (specific requirement)
  if (
    counts.copyCount > 1 &&
    counts.windowBlurCount > 1 &&
    counts.tabHiddenCount > 3
  ) {
    score = Math.max(score, 5); // Ensure at least medium risk
  }

  // High-risk events
  if (counts.phoneDetected) score += 4;
  if (counts.multiplePeople) score += 5;

  // Additional patterns
  if (counts.tabHiddenCount > 10) score += 2;
  if (counts.copyCount + counts.pasteCount > 5) score += 2;

  return Math.min(score, 10); // Cap at 10
};

async function recalculateAllRiskScores() {
  console.log('Starting risk score recalculation...');

  try {
    // Get all test attempts with proctoring enabled
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        proctoringEnabled: true,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        riskScore: true,
      },
    });

    console.log(
      `Found ${testAttempts.length} test attempts with proctoring enabled`
    );

    let updated = 0;
    let errors = 0;

    // Process each test attempt
    for (const attempt of testAttempts) {
      try {
        // Get proctoring events for this attempt
        const proctorEvents = await prisma.proctorEvent.findMany({
          where: {
            attemptId: attempt.id,
          },
          select: {
            type: true,
            ts: true,
            extra: true,
          },
        });

        // Calculate new risk score
        const newRiskScore = calculateRiskScore(proctorEvents);

        // Update the test attempt with new risk score
        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { riskScore: newRiskScore },
        });

        console.log(
          `Updated ${attempt.candidateName} (${attempt.candidateEmail}): ${attempt.riskScore} -> ${newRiskScore}`
        );
        updated++;
      } catch (error) {
        console.error(`Error processing attempt ${attempt.id}:`, error);
        errors++;
      }
    }

    // Also process public test attempts
    const publicTestAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        proctoringEnabled: true,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        riskScore: true,
      },
    });

    console.log(
      `Found ${publicTestAttempts.length} public test attempts with proctoring enabled`
    );

    // Process each public test attempt
    for (const attempt of publicTestAttempts) {
      try {
        // Get proctoring events for this attempt
        const proctorEvents = await prisma.publicProctorEvent.findMany({
          where: {
            attemptId: attempt.id,
          },
          select: {
            type: true,
            ts: true,
            extra: true,
          },
        });

        // Calculate new risk score
        const newRiskScore = calculateRiskScore(proctorEvents);

        // Update the public test attempt with new risk score
        await prisma.publicTestAttempt.update({
          where: { id: attempt.id },
          data: { riskScore: newRiskScore },
        });

        console.log(
          `Updated public attempt ${attempt.candidateName} (${attempt.candidateEmail}): ${attempt.riskScore} -> ${newRiskScore}`
        );
        updated++;
      } catch (error) {
        console.error(`Error processing public attempt ${attempt.id}:`, error);
        errors++;
      }
    }

    console.log('\n=== Recalculation Complete ===');
    console.log(
      `Total attempts processed: ${testAttempts.length + publicTestAttempts.length}`
    );
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Fatal error during recalculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the recalculation
recalculateAllRiskScores();
