-- Create view for candidate leaderboard scores (includes both regular and public attempts)
CREATE OR REPLACE VIEW vw_candidate_scores AS
WITH combined_attempts AS (
  -- Regular test attempts
  SELECT
    ta.id AS "attemptId",
    ta."invitationId",
    COALESCE(ta."candidateName", inv."candidateName", 'Anonymous') AS "candidateName",
    COALESCE(ta."candidateEmail", inv."candidateEmail", '') AS "candidateEmail",
    ta."completedAt",
    EXTRACT(EPOCH FROM (ta."completedAt" - ta."startedAt"))::int AS "durationSeconds",
    ta."categorySubScores"
  FROM "TestAttempt" ta
  LEFT JOIN "Invitation" inv ON inv.id = ta."invitationId"
  WHERE ta.status = 'COMPLETED'
    AND ta."completedAt" IS NOT NULL
    AND ta."categorySubScores" IS NOT NULL

  UNION ALL

  -- Public test attempts
  SELECT
    pta.id AS "attemptId",
    NULL AS "invitationId",
    COALESCE(pta."candidateName", 'Anonymous') AS "candidateName",
    COALESCE(pta."candidateEmail", '') AS "candidateEmail",
    pta."completedAt",
    EXTRACT(EPOCH FROM (pta."completedAt" - pta."startedAt"))::int AS "durationSeconds",
    pta."categorySubScores"
  FROM "PublicTestAttempt" pta
  WHERE pta.status = 'COMPLETED'
    AND pta."completedAt" IS NOT NULL
    AND pta."categorySubScores" IS NOT NULL
)
SELECT
  ca."attemptId",
  ca."invitationId",
  ca."candidateName",
  ca."candidateEmail",
  ca."completedAt",
  ca."durationSeconds",
  -- Extract percentage scores from categorySubScores JSON (calculate from correct/total)
  CASE 
    WHEN (ca."categorySubScores"->'LOGICAL'->>'total')::float > 0 
    THEN ((ca."categorySubScores"->'LOGICAL'->>'correct')::float / (ca."categorySubScores"->'LOGICAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreLogical",
  CASE 
    WHEN (ca."categorySubScores"->'VERBAL'->>'total')::float > 0 
    THEN ((ca."categorySubScores"->'VERBAL'->>'correct')::float / (ca."categorySubScores"->'VERBAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreVerbal",
  CASE 
    WHEN (ca."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
    THEN ((ca."categorySubScores"->'NUMERICAL'->>'correct')::float / (ca."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreNumerical",
  CASE 
    WHEN (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
    THEN ((ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreAttention",
  -- Composite score (simple average of percentages)
  ((
    CASE 
      WHEN (ca."categorySubScores"->'LOGICAL'->>'total')::float > 0 
      THEN ((ca."categorySubScores"->'LOGICAL'->>'correct')::float / (ca."categorySubScores"->'LOGICAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ca."categorySubScores"->'VERBAL'->>'total')::float > 0 
      THEN ((ca."categorySubScores"->'VERBAL'->>'correct')::float / (ca."categorySubScores"->'VERBAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ca."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
      THEN ((ca."categorySubScores"->'NUMERICAL'->>'correct')::float / (ca."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
      THEN ((ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
      ELSE 0 
    END
  ) / 4.0) AS "composite",
  -- Percentile ranking
  ((PERCENT_RANK() OVER (ORDER BY
    ((
      CASE 
        WHEN (ca."categorySubScores"->'LOGICAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'LOGICAL'->>'correct')::float / (ca."categorySubScores"->'LOGICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'VERBAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'VERBAL'->>'correct')::float / (ca."categorySubScores"->'VERBAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'NUMERICAL'->>'correct')::float / (ca."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
        ELSE 0 
      END
    ) / 4.0) DESC
  ) * 100)) AS "percentile",
  -- Dense rank for leaderboard
  DENSE_RANK() OVER (ORDER BY
    ((
      CASE 
        WHEN (ca."categorySubScores"->'LOGICAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'LOGICAL'->>'correct')::float / (ca."categorySubScores"->'LOGICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'VERBAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'VERBAL'->>'correct')::float / (ca."categorySubScores"->'VERBAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'NUMERICAL'->>'correct')::float / (ca."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
        THEN ((ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ca."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
        ELSE 0 
      END
    ) / 4.0) DESC,
    ca."durationSeconds" ASC
  ) AS "rank"
FROM combined_attempts ca; 