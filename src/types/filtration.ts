export type StageId = 1 | 2 | 3 | 4;
export type SolenoidId = 1 | 2 | 3;

export interface StageState {
  id: StageId;
  flowing: boolean;
}

export interface TankState {
  level: number; // 0-100 %
  micron: string; // filtration rating, e.g. "0.3"
  filling: boolean;
}

export interface SolenoidState {
  id: SolenoidId;
  label: string;
  open: boolean;
}

export interface PumpState {
  running: boolean;
}

export interface SensorReadings {
  tdsAfterStage2: number; // ppm, water quality sensor between stage 2 and the tank A / pump split
  tdsBeforeStage4: number; // ppm, water quality sensor just before stage 4's inlet
  flowToTankA: number; // L/min, flow sensor just before Tank A's inlet
}

export interface SystemState {
  timestamp: number;
  simulated: boolean;
  feedFlowing: boolean;
  stages: Record<StageId, StageState>;
  tankA: TankState;
  tankB: TankState;
  solenoids: Record<SolenoidId, SolenoidState>;
  pump: PumpState;
  externalOutletFlowing: boolean;
  sensors: SensorReadings;
}
