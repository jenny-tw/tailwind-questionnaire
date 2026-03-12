import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const CATEGORY_SHORT = {
  'Problem & Market': 'Problem &\nMarket',
  'Competitive Position': 'Competitive\nPosition',
  'Commercial Traction': 'Commercial\nTraction',
  'Team & Governance': 'Team &\nGovernance',
  'Financial Story': 'Financial\nStory',
  'Narrative': 'Narrative',
}

export default function RadarChartComponent({ scores, benchmarks, stage }) {
  const data = Object.keys(scores).map(category => ({
    subject: CATEGORY_SHORT[category] || category,
    fullName: category,
    score: scores[category] ?? 0,
    benchmark: benchmarks ? (benchmarks[category] ?? 0) : undefined,
  }))

  return (
    <div className="radar-wrapper" aria-label="Category scores radar chart">
      <ResponsiveContainer width="100%" height={400}>
        <ReRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#03025e', fontSize: 12, fontWeight: 600 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Your Score"
            dataKey="score"
            stroke="#255cff"
            fill="#255cff"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          {benchmarks && (
            <Radar
              name={stage ? `${stage} Benchmark` : 'Benchmark'}
              dataKey="benchmark"
              stroke="#e4a840"
              fill="#e4a840"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          )}
          <Legend />
          <Tooltip
            formatter={(value, name) => [`${value} / 10`, name]}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
