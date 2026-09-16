interface SensorProps {
  x: number;
  y: number;
  tag: string;
  value: string;
  active: boolean;
  /** point on the pipe/vessel this instrument taps into */
  leaderTo: { x: number; y: number };
}

export function Sensor({ x, y, tag, value, active, leaderTo }: SensorProps) {
  const color = active ? "#34e3e0" : "#4a5b68";
  const r = 16;
  const leaderPointsDown = leaderTo.y >= y;

  return (
    <g>
      <line x1={x} y1={y} x2={leaderTo.x} y2={leaderTo.y} stroke={color} strokeWidth={1} opacity={0.7} />
      <g transform={`translate(${x},${y})`}>
        <circle r={r} fill="#0d1418" stroke={color} strokeWidth={2} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fontFamily="var(--font-mono)" fill={color}>
          {tag}
        </text>
        <text
          y={leaderPointsDown ? -(r + 8) : r + 16}
          textAnchor="middle"
          fontSize={9.5}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          fill={active ? "#c8d6e0" : "#6b8190"}
        >
          {value}
        </text>
      </g>
    </g>
  );
}
