import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// Utility function to safely convert to number and handle NaN
const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

interface CandidateScore {
  attemptId: string;
  candidateName: string;
  scoreLogical: number;
  scoreVerbal: number;
  scoreNumerical: number;
  scoreAttention: number;
  scoreOther: number;
}

interface RadarCompareProps {
  candidates: CandidateScore[];
}

// Colors for different candidates
const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
];

export default function RadarCompare({ candidates }: RadarCompareProps) {
  // Transform data for radar chart with safe number handling
  const categories = [
    { name: 'Logical', key: 'scoreLogical' },
    { name: 'Verbal', key: 'scoreVerbal' },
    { name: 'Numerical', key: 'scoreNumerical' },
    { name: 'Attention', key: 'scoreAttention' },
    { name: 'Other', key: 'scoreOther' },
  ];

  const data = categories.map((category) => {
    const dataPoint: any = { category: category.name };

    candidates.forEach((candidate, index) => {
      const rawValue = candidate[category.key as keyof CandidateScore];
      dataPoint[candidate.candidateName] = safeNumber(rawValue, 0);
    });

    return dataPoint;
  });

  // Filter out candidates with all zero values to avoid rendering issues
  const validCandidates = candidates.filter((candidate) => {
    const hasValidScores = categories.some((category) => {
      const value = safeNumber(
        candidate[category.key as keyof CandidateScore],
        0
      );
      return value > 0;
    });
    return hasValidScores;
  });

  if (validCandidates.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="mb-4 text-4xl">📊</div>
          <p>No valid candidate data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        >
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickCount={5}
            allowDataOverflow={false}
          />

          {validCandidates.map((candidate, index) => (
            <Radar
              key={candidate.attemptId}
              name={candidate.candidateName}
              dataKey={candidate.candidateName}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
            />
          ))}

          <Tooltip
            formatter={(value: any, name: string) => [
              `${safeNumber(value, 0).toFixed(1)}%`,
              name,
            ]}
            labelFormatter={(label) => `${label} Reasoning`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
            }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
