interface RiskScoreGaugeProps {
  score: number | null;
  size?: number;
}

function getRiskLabel(score: number): { label: string; color: string; stroke: string } {
  if (score >= 80) return { label: 'Critical', color: '#DC2626', stroke: '#DC2626' };
  if (score >= 60) return { label: 'High', color: '#EA580C', stroke: '#EA580C' };
  if (score >= 30) return { label: 'Medium', color: '#D97706', stroke: '#D97706' };
  return { label: 'Low', color: '#16A34A', stroke: '#16A34A' };
}

export function RiskScoreGauge({ score, size = 120 }: RiskScoreGaugeProps) {
  if (score == null) {
    return (
      <div
        style={{ width: size, height: size / 2 + 24 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="text-gray-300 text-xs">No score</div>
      </div>
    );
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const { label, color, stroke } = getRiskLabel(normalizedScore);

  // Semicircle gauge
  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // half-circle arc length

  // Progress as fraction of half-circle
  const progress = normalizedScore / 100;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress * circumference;

  // Arc path for the background track (half circle from left to right, top)
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  const trackPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  // Rotate transform so arc goes left-to-right bottom-to-top
  // Standard SVG: we draw a top semicircle
  const topStartX = cx - radius;
  const topStartY = cy;
  const arcPath = `M ${topStartX} ${topStartY} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease', transformOrigin: `${cx}px ${cy}px`, transform: 'scaleX(-1)' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight="700"
          fill={color}
        >
          {normalizedScore}
        </text>
      </svg>
      <div className="text-xs font-semibold mt-1" style={{ color }}>
        {label} Risk
      </div>
    </div>
  );
}
