import type { ActuatorCommand } from "../types/site";

export interface RuleTarget {
  id: string;
  label: string;
  unit?: string;
}

export interface RuleSensor extends RuleTarget {
  value: number;
}

export interface RuleActuator extends RuleTarget {
  on: boolean;
}

/**
 * Whatever a site "is" (the original hardcoded rig, or a generic
 * drag-and-drop one), it exposes this same shape so the rule engine and the
 * Automation page don't need to know which kind of site they're driving.
 */
export interface RuleContext {
  sensors: RuleSensor[];
  actuators: RuleActuator[];
  dispatch(actuatorId: string, command: ActuatorCommand): void;
}
