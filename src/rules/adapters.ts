import type { SolenoidId, SystemState } from "../types/filtration";
import type { Site, ActuatorCommand } from "../types/site";
import type { RuntimeValue } from "../hooks/useGenericSiteRuntime";
import type { RuleContext } from "./types";

/**
 * Adapts the original filtration skid (untouched -- see useFiltrationData)
 * into the generic RuleContext shape, so the same Automation page and rule
 * engine work for it too. Sensors keep their real, existing units (ppm,
 * L/min, %) rather than being forced into mA -- that sensor was never
 * calibrated to a current loop, so pretending otherwise would be misleading.
 */
export function buildLegacyRuleContext(
  state: SystemState,
  controls: { toggleSolenoid: (id: SolenoidId) => void; togglePump: () => void },
): RuleContext {
  const actuators = [
    { id: "solenoid1", label: state.solenoids[1].label, on: state.solenoids[1].open },
    { id: "solenoid2", label: state.solenoids[2].label, on: state.solenoids[2].open },
    { id: "solenoid3", label: state.solenoids[3].label, on: state.solenoids[3].open },
    { id: "pump1", label: "PUMP-1", on: state.pump.running },
  ];

  function dispatch(actuatorId: string, command: ActuatorCommand) {
    const actuator = actuators.find((a) => a.id === actuatorId);
    // toggleSolenoid/togglePump only flip current state, so guard on it here
    // to keep dispatch idempotent for the rule engine.
    if (!actuator || actuator.on === (command === "on")) return;
    if (actuatorId === "pump1") controls.togglePump();
    else if (actuatorId === "solenoid1" || actuatorId === "solenoid2" || actuatorId === "solenoid3") {
      controls.toggleSolenoid(Number(actuatorId.slice(-1)) as SolenoidId);
    }
  }

  return {
    sensors: [
      { id: "tdsAfterStage2", label: "TDS-1", unit: "ppm", value: state.sensors.tdsAfterStage2 },
      { id: "tdsBeforeStage4", label: "TDS-2", unit: "ppm", value: state.sensors.tdsBeforeStage4 },
      { id: "flowToTankA", label: "FLOW", unit: "L/min", value: state.sensors.flowToTankA },
      { id: "levelA", label: "LVL-A", unit: "%", value: state.tankA.level },
      { id: "levelB", label: "LVL-B", unit: "%", value: state.tankB.level },
    ],
    actuators,
    dispatch,
  };
}

/** Adapts a generic drag-and-drop site + its runtime values into a RuleContext. */
export function buildGenericRuleContext(
  site: Site,
  runtime: Record<string, RuntimeValue>,
  dispatch: (deviceId: string, command: ActuatorCommand) => void,
): RuleContext {
  const sensors = site.devices
    .filter((d) => d.type === "sensor")
    .map((d) => ({ id: d.id, label: d.label, unit: d.unit ?? "mA", value: runtime[d.id]?.value ?? 0 }));

  const actuators = site.devices
    .filter((d) => d.type === "pump" || d.type === "valve" || d.type === "alarm")
    .map((d) => ({ id: d.id, label: d.label, on: runtime[d.id]?.on ?? false }));

  return { sensors, actuators, dispatch };
}
