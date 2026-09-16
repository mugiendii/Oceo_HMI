import type { SolenoidId, SystemState } from "../types/filtration";
import { FilterStage } from "./FilterStage";
import { SolenoidValve } from "./SolenoidValve";
import { FiltrationPump } from "./FiltrationPump";
import { FiltrationTank } from "./FiltrationTank";
import { Pipe } from "./Pipe";
import { Sensor } from "./Sensor";

interface FiltrationDiagramProps {
  state: SystemState;
  onToggleSolenoid: (id: SolenoidId) => void;
  onTogglePump: () => void;
}

// Layout coordinates mirror the P&ID reference drawing: Tank A + stages 1-2
// on the left, Tank B + stages 3-4 on the right, a shared pump/valve spine
// down the middle, and the external outlet tapped off between stages 3 & 4.
const STAGE_W = 90;
const STAGE_H = 150;
const STAGE_Y = 250;

const STAGE1_X = 40;
const STAGE2_X = 170;
const STAGE3_X = 760;
const STAGE4_X = 900;

const SPINE_X = 505;
const DISCHARGE_X = 600;
const OUTLET_TAP_X = 875;

export function FiltrationDiagram({ state, onToggleSolenoid, onTogglePump }: FiltrationDiagramProps) {
  const { stages, tankA, tankB, solenoids, pump, feedFlowing, externalOutletFlowing, sensors } = state;

  const s2mid = STAGE2_X + STAGE_W / 2;
  const s3mid = STAGE3_X + STAGE_W / 2;
  const s4mid = STAGE4_X + STAGE_W / 2;

  return (
    <svg viewBox="0 0 1180 660" className="w-full h-full" style={{ minHeight: 520 }}>
      <defs>
        <marker id="pipe-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#2ee66b" />
        </marker>
        <marker id="pipe-arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#3a4d5c" />
        </marker>
        <pattern id="diagram-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24,0 L0,0 L0,24" fill="none" stroke="#182129" strokeWidth={1} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={1180} height={660} fill="#0a0f13" />
      <rect x={0} y={0} width={1180} height={660} fill="url(#diagram-grid)" />

      {/* ---- Pipes ---- */}
      <Pipe d={`M10,215 L${STAGE1_X + STAGE_W / 2},215 L${STAGE1_X + STAGE_W / 2},250`} active={feedFlowing} />
      <Pipe d={`M${STAGE1_X + STAGE_W},325 L${STAGE2_X},325`} active={stages[1].flowing} />
      <Pipe d={`M${s2mid},250 L${s2mid},220 L${SPINE_X},220`} active={stages[2].flowing} />
      <Pipe d={`M${SPINE_X},220 L${SPINE_X},75 L250,75`} active={solenoids[1].open} />
      <Pipe d={`M${SPINE_X},220 L${SPINE_X},520`} active={solenoids[2].open} />
      <Pipe d={`M545,560 L${DISCHARGE_X},560 L${DISCHARGE_X},190`} active={stages[3].flowing} />
      <Pipe d={`M${DISCHARGE_X},190 L${s3mid},190 L${s3mid},250`} active={stages[3].flowing} />
      {/* Stage 3 output splits: onward to stage 4, and via solenoid 3 to the external outlet */}
      <Pipe d={`M${STAGE3_X + STAGE_W},325 L${OUTLET_TAP_X},325`} active={stages[3].flowing} />
      <Pipe d={`M${OUTLET_TAP_X},325 L${OUTLET_TAP_X},190 L${s4mid},190 L${s4mid},250`} active={stages[3].flowing && stages[4].flowing} />
      <Pipe d={`M${OUTLET_TAP_X},325 L${OUTLET_TAP_X},610`} active={solenoids[3].open && externalOutletFlowing} />
      <Pipe d={`M${STAGE4_X + STAGE_W},325 L1035,325 L1035,75 L930,75`} active={stages[4].flowing} />

      {/* ---- Tanks ---- */}
      <FiltrationTank x={30} y={20} width={220} height={110} title="TANK A" micron={tankA.micron} level={tankA.level} filling={tankA.filling} />
      <FiltrationTank x={930} y={20} width={220} height={110} title="TANK B" micron={tankB.micron} level={tankB.level} filling={tankB.filling} />

      {/* ---- Filter stages ---- */}
      <FilterStage x={STAGE1_X} y={STAGE_Y} width={STAGE_W} height={STAGE_H} id={1} flowing={stages[1].flowing} />
      <FilterStage x={STAGE2_X} y={STAGE_Y} width={STAGE_W} height={STAGE_H} id={2} flowing={stages[2].flowing} />
      <FilterStage x={STAGE3_X} y={STAGE_Y} width={STAGE_W} height={STAGE_H} id={3} flowing={stages[3].flowing} />
      <FilterStage x={STAGE4_X} y={STAGE_Y} width={STAGE_W} height={STAGE_H} id={4} flowing={stages[4].flowing} />

      {/* ---- Solenoid valves ---- */}
      <SolenoidValve
        x={SPINE_X}
        y={150}
        label={solenoids[1].label}
        open={solenoids[1].open}
        vertical
        onToggle={() => onToggleSolenoid(1)}
      />
      <SolenoidValve
        x={SPINE_X}
        y={290}
        label={solenoids[2].label}
        open={solenoids[2].open}
        vertical
        onToggle={() => onToggleSolenoid(2)}
      />
      <SolenoidValve
        x={OUTLET_TAP_X}
        y={460}
        label={solenoids[3].label}
        open={solenoids[3].open}
        vertical
        onToggle={() => onToggleSolenoid(3)}
      />

      {/* ---- Pump ---- */}
      <FiltrationPump x={505} y={560} running={pump.running} onToggle={onTogglePump} />

      {/* ---- Sensors / instrumentation ---- */}
      <Sensor
        x={300}
        y={175}
        tag="TDS-1"
        value={`${sensors.tdsAfterStage2.toFixed(0)} ppm`}
        active={stages[2].flowing}
        leaderTo={{ x: 300, y: 220 }}
      />
      <Sensor
        x={915}
        y={160}
        tag="TDS-2"
        value={`${sensors.tdsBeforeStage4.toFixed(0)} ppm`}
        active={stages[3].flowing && stages[4].flowing}
        leaderTo={{ x: 915, y: 190 }}
      />
      <Sensor
        x={380}
        y={120}
        tag="FLOW"
        value={`${sensors.flowToTankA.toFixed(1)} L/min`}
        active={solenoids[1].open}
        leaderTo={{ x: 380, y: 75 }}
      />
      <Sensor
        x={18}
        y={75}
        tag="LVL-A"
        value={`${tankA.level.toFixed(0)} %`}
        active={tankA.filling}
        leaderTo={{ x: 30, y: 75 }}
      />
      <Sensor
        x={1162}
        y={75}
        tag="LVL-B"
        value={`${tankB.level.toFixed(0)} %`}
        active={tankB.filling}
        leaderTo={{ x: 1150, y: 75 }}
      />

      {/* ---- labels ---- */}
      <text x={10} y={205} fontSize={10} fontFamily="var(--font-mono)" fill="#6b8190" fontWeight={600}>
        FEED IN
      </text>
      <text
        x={OUTLET_TAP_X}
        y={630}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fontWeight={700}
        fill={externalOutletFlowing ? "#2ee66b" : "#6b8190"}
      >
        EXTERNAL OUTLET
      </text>
    </svg>
  );
}
