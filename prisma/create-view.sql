-- Create view for candidate leaderboard scores
CREATE OR REPLACE VIEW vw_candidate_scores AS
SELECT
  ta.id              AS "attemptId",
  ta."invitationId",
  COALESCE(inv."candidateName", 'Anonymous') AS "candidateName",
  COALESCE(inv."candidateEmail", '')         AS "candidateEmail",
  ta."completedAt",
  EXTRACT(EPOCH FROM (ta."completedAt" - ta."startedAt"))::int AS "durationSeconds",
  -- Extract percentage scores from categorySubScores JSON (calculate from correct/total)
  CASE 
    WHEN (ta."categorySubScores"->'LOGICAL'->>'total')::float > 0 
    THEN ((ta."categorySubScores"->'LOGICAL'->>'correct')::float / (ta."categorySubScores"->'LOGICAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreLogical",
  CASE 
    WHEN (ta."categorySubScores"->'VERBAL'->>'total')::float > 0 
    THEN ((ta."categorySubScores"->'VERBAL'->>'correct')::float / (ta."categorySubScores"->'VERBAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreVerbal",
  CASE 
    WHEN (ta."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
    THEN ((ta."categorySubScores"->'NUMERICAL'->>'correct')::float / (ta."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreNumerical",
  CASE 
    WHEN (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
    THEN ((ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
    ELSE 0 
  END AS "scoreAttention",
  -- Composite score (simple average of percentages)
  ((
    CASE 
      WHEN (ta."categorySubScores"->'LOGICAL'->>'total')::float > 0 
      THEN ((ta."categorySubScores"->'LOGICAL'->>'correct')::float / (ta."categorySubScores"->'LOGICAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ta."categorySubScores"->'VERBAL'->>'total')::float > 0 
      THEN ((ta."categorySubScores"->'VERBAL'->>'correct')::float / (ta."categorySubScores"->'VERBAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ta."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
      THEN ((ta."categorySubScores"->'NUMERICAL'->>'correct')::float / (ta."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
      ELSE 0 
    END +
    CASE 
      WHEN (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
      THEN ((ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
      ELSE 0 
    END
  ) / 4.0) AS "composite",
  -- Percentile ranking
  ((PERCENT_RANK() OVER (ORDER BY
    ((
      CASE 
        WHEN (ta."categorySubScores"->'LOGICAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'LOGICAL'->>'correct')::float / (ta."categorySubScores"->'LOGICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'VERBAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'VERBAL'->>'correct')::float / (ta."categorySubScores"->'VERBAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'NUMERICAL'->>'correct')::float / (ta."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
        ELSE 0 
      END
    ) / 4.0) DESC
  ) * 100)) AS "percentile",
  -- Dense rank for leaderboard
  DENSE_RANK() OVER (ORDER BY
    ((
      CASE 
        WHEN (ta."categorySubScores"->'LOGICAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'LOGICAL'->>'correct')::float / (ta."categorySubScores"->'LOGICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'VERBAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'VERBAL'->>'correct')::float / (ta."categorySubScores"->'VERBAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'NUMERICAL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'NUMERICAL'->>'correct')::float / (ta."categorySubScores"->'NUMERICAL'->>'total')::float * 100)
        ELSE 0 
      END +
      CASE 
        WHEN (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float > 0 
        THEN ((ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'correct')::float / (ta."categorySubScores"->'ATTENTION_TO_DETAIL'->>'total')::float * 100)
        ELSE 0 
      END
    ) / 4.0) DESC,
    EXTRACT(EPOCH FROM (ta."completedAt" - ta."startedAt")) ASC
  ) AS "rank"
FROM "TestAttempt" ta
JOIN "Invitation" inv ON inv.id = ta."invitationId"
WHERE ta.status = 'COMPLETED'
  AND ta."completedAt" IS NOT NULL
  AND ta."categorySubScores" IS NOT NULL; 