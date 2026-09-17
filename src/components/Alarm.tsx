interface AlarmProps {
  x: number;
  y: number;
  label: string;
  active: boolean;
  onToggle?: () => void;
}

export function Alarm({ x, y, label, active, onToggle }: AlarmProps) {
  const color = active ? "#ff3b3b" : "#4a5b68";
  const r = 22;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onToggle}
      className={onToggle ? "cursor-pointer" : undefined}
      role={onToggle ? "button" : undefined}
    >
      {/* generous invisible hit area, same idea as SolenoidValve */}
      {onToggle && <circle r={30} fill="transparent" />}

      <g className={active ? "animate-blink-fast" : ""}>
        <path
          d={`M0,${-r} L${r},${r * 0.8} L${-r},${r * 0.8} Z`}
          fill="#0d1418"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <line x1={0} y1={-r * 0.35} x2={0} y2={r * 0.15} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={0} cy={r * 0.45} r={1.8} fill={color} />
      </g>

      <text
        x={0}
        y={r + 18}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fill={active ? "#ff3b3b" : "#6b8190"}
        fontWeight={600}
      >
        {label}
      </text>
      <text
        x={0}
        y={r + 31}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill={active ? "#ff3b3b" : "#6b8190"}
        fontWeight={700}
        letterSpacing={1}
      >
        {active ? "ALARM" : "NORMAL"}
      </text>
    </g>
  );
}
