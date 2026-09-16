interface FiltrationPumpProps {
  x: number;
  y: number;
  running: boolean;
  onToggle?: () => void;
}

export function FiltrationPump({ x, y, running, onToggle }: FiltrationPumpProps) {
  const color = running ? "#2ee66b" : "#4a5b68";
  const r = 40;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onToggle}
      className={onToggle ? "cursor-pointer" : undefined}
      role={onToggle ? "button" : undefined}
    >
      <circle cx={0} cy={0} r={r} fill="#0d1418" stroke="#2a3a47" strokeWidth={2} />
      <circle
        cx={0}
        cy={0}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        className={running ? "animate-pulse-glow" : ""}
        style={{ color }}
      />
      <g className={running ? "animate-spin-slow" : ""} style={{ transformOrigin: "0px 0px" }}>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect key={deg} x={-2} y={-r + 8} width={4} height={20} rx={2} fill={color} opacity={running ? 0.85 : 0.4} transform={`rotate(${deg})`} />
        ))}
        <circle cx={0} cy={0} r={7} fill={color} opacity={running ? 1 : 0.4} />
      </g>
      <text
        x={0}
        y={r + 22}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fontFamily="var(--font-mono)"
        fill={running ? "#2ee66b" : "#6b8190"}
      >
        PUMP {running ? "RUNNING" : "STOPPED"}
      </text>
    </g>
  );
}
