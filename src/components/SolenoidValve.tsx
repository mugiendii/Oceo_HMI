interface SolenoidValveProps {
  x: number;
  y: number;
  label: string;
  open: boolean;
  /** rotate the bowtie 90deg for valves sitting on a vertical run */
  vertical?: boolean;
  onToggle?: () => void;
}

export function SolenoidValve({ x, y, label, open, vertical = false, onToggle }: SolenoidValveProps) {
  const color = open ? "#2ee66b" : "#4a5b68";
  const r = 13;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onToggle}
      className={onToggle ? "cursor-pointer" : undefined}
      role={onToggle ? "button" : undefined}
    >
      {/* generous invisible hit area so the small valve icon is easy to click */}
      {onToggle && <circle r={30} fill="transparent" />}

      <g transform={vertical ? "rotate(90)" : undefined} className={open ? "animate-pulse-glow" : ""} style={{ color }}>
        {/* bowtie valve body */}
        <path
          d={`M${-r},${-r} L${r},${r} L${r},${-r} L${-r},${r} Z`}
          fill="#0d1418"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* actuator stem + solenoid coil */}
        <line x1={0} y1={-r} x2={0} y2={-r - 10} stroke={color} strokeWidth={2} />
        <rect x={-7} y={-r - 22} width={14} height={12} rx={2} fill="#0d1418" stroke={color} strokeWidth={2} />
      </g>
      <text
        x={0}
        y={vertical ? r + 34 : r + 26}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fill={open ? "#2ee66b" : "#6b8190"}
        fontWeight={600}
      >
        {label}
      </text>
      <text
        x={0}
        y={vertical ? r + 47 : r + 39}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill={open ? "#2ee66b" : "#ff3b3b"}
        fontWeight={700}
        letterSpacing={1}
      >
        {open ? "OPEN" : "SHUT"}
      </text>
    </g>
  );
}
