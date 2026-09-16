interface FilterStageProps {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
  flowing: boolean;
}

export function FilterStage({ x, y, width, height, id, flowing }: FilterStageProps) {
  const color = flowing ? "#2ee66b" : "#4a5b68";

  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        width={width}
        height={height}
        rx={4}
        fill="#0d1418"
        stroke={color}
        strokeWidth={2}
        className={flowing ? "animate-pulse-glow" : ""}
        style={{ color }}
      />
      {/* filter cartridge pleats */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={10}
          y1={22 + i * ((height - 44) / 4)}
          x2={width - 10}
          y2={22 + i * ((height - 44) / 4)}
          stroke={color}
          strokeWidth={1}
          opacity={0.35}
        />
      ))}
      <text
        x={width / 2}
        y={height / 2 + 6}
        textAnchor="middle"
        fontSize={20}
        fontWeight={700}
        fontFamily="var(--font-mono)"
        fill="#eaf2f7"
      >
        {id}
      </text>
      <text
        x={width / 2}
        y={height + 18}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontFamily="var(--font-mono)"
        fill="#6b8190"
      >
        STAGE {id}
      </text>
    </g>
  );
}
