import { useId } from "react";

interface FiltrationTankProps {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  micron: string;
  level: number;
  filling: boolean;
}

export function FiltrationTank({ x, y, width, height, title, micron, level, filling }: FiltrationTankProps) {
  const clipId = useId();
  const clamped = Math.max(0, Math.min(100, level));
  const waterTopY = height * (1 - clamped / 100);
  const color = filling ? "#2ee66b" : "#2fa8ff";

  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={width} height={height} rx={6} fill="#0a1115" stroke="#2a3a47" strokeWidth={2} />

      <clipPath id={clipId}>
        <rect x={2} y={2} width={width - 4} height={height - 4} rx={5} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={0}
          y={waterTopY}
          width={width}
          height={height}
          fill={color}
          opacity={0.5}
          style={{ transition: "y 1.1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </g>

      <rect width={width} height={height} rx={6} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      <text x={width / 2} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="var(--font-mono)" fill="#eaf2f7">
        {title}
      </text>
      <text x={width / 2} y={height / 2 + 8} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily="var(--font-mono)" fill="#eaf2f7" opacity={0.9}>
        {clamped.toFixed(0)}%
      </text>
      <text x={width / 2} y={height - 10} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="#6b8190">
        {micron} µm FILTERED
      </text>
    </g>
  );
}
