-- Create view for candidate leaderboard scores
CREATE OR REPLACE VIEW vw_candidate_scores AS
SELECT
  ta.id              AS "attemptId",
  ta."invitationId",
  COALESCE(inv."candidateName", 'Anonymous') AS "candidateName",
  COALESCE(inv."candidateEmail", '')         AS "candidateEmail",
  ta."completedAt",
  EXTRACT(EPOCH FROM (ta."completedAt" - ta."startedAt"))::int AS "durationSeconds",
  -- Extract percentage scores from categorySubScores JSON
  COALESCE((ta."categorySubScores"->>'LOGICAL')::float, 0)          AS "scoreLogical",
  COALESCE((ta."categorySubScores"->>'VERBAL')::float, 0)           AS "scoreVerbal", 
  COALESCE((ta."categorySubScores"->>'NUMERICAL')::float, 0)        AS "scoreNumerical",
  COALESCE((ta."categorySubScores"->>'ATTENTION_TO_DETAIL')::float, 0) AS "scoreAttention",
  -- Composite score (simple average, tweakable later)
  ROUND((
    COALESCE((ta."categorySubScores"->>'LOGICAL')::float, 0) +
    COALESCE((ta."categorySubScores"->>'VERBAL')::float, 0) +
    COALESCE((ta."categorySubScores"->>'NUMERICAL')::float, 0) +
    COALESCE((ta."categorySubScores"->>'ATTENTION_TO_DETAIL')::float, 0)
  ) / 4.0, 2) AS "composite",
  -- Percentile ranking
  ROUND((PERCENT_RANK() OVER (ORDER BY
    (COALESCE((ta."categorySubScores"->>'LOGICAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'VERBAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'NUMERICAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'ATTENTION_TO_DETAIL')::float, 0)) / 4.0 DESC
  ) * 100)::numeric, 1) AS "percentile",
  -- Dense rank for leaderboard
  DENSE_RANK() OVER (ORDER BY
    (COALESCE((ta."categorySubScores"->>'LOGICAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'VERBAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'NUMERICAL')::float, 0) +
     COALESCE((ta."categorySubScores"->>'ATTENTION_TO_DETAIL')::float, 0)) / 4.0 DESC,
    EXTRACT(EPOCH FROM (ta."completedAt" - ta."startedAt")) ASC
  ) AS "rank"
FROM "TestAttempt" ta
JOIN "Invitation" inv ON inv.id = ta."invitationId"
WHERE ta.status = 'COMPLETED'
  AND ta."completedAt" IS NOT NULL
  AND ta."categorySubScores" IS NOT NULL; 