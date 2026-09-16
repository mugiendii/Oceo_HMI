interface PipeProps {
  d: string;
  active: boolean;
  arrow?: boolean;
}

export function Pipe({ d, active, arrow = true }: PipeProps) {
  const color = active ? "#2ee66b" : "#3a4d5c";

  return (
    <g>
      {/* pipe casing */}
      <path d={d} fill="none" stroke="#1a2530" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* flow */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={arrow ? (active ? "url(#pipe-arrow-active)" : "url(#pipe-arrow-inactive)") : undefined}
      />
      {active && (
        <path
          d={d}
          fill="none"
          stroke="#c9ffdd"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 10"
          opacity={0.9}
          className="animate-pipe-flow"
        />
      )}
    </g>
  );
}
