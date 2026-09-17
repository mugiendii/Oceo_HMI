import type { Rule, RuleOperator } from "../types/site";
import type { RuleContext } from "./types";

function compare(value: number, operator: RuleOperator, threshold: number): boolean {
  switch (operator) {
    case ">=":
      return value >= threshold;
    case "<=":
      return value <= threshold;
    case ">":
      return value > threshold;
    case "<":
      return value < threshold;
    case "==":
      return value === threshold;
  }
}

export function isRuleConditionTrue(ctx: RuleContext, rule: Rule): boolean {
  const sensor = ctx.sensors.find((s) => s.id === rule.condition.sensorId);
  if (!sensor) return false;
  return compare(sensor.value, rule.condition.operator, rule.condition.value);
}

/**
 * Runs every enabled rule against the current context. Safe to call on
 * every tick even while a condition stays continuously true: dispatch() on
 * both the legacy and generic contexts is idempotent (a no-op once the
 * actuator already matches the commanded state), so this never fights
 * itself into a toggle loop.
 */
export function evaluateRules(ctx: RuleContext, rules: Rule[]): void {
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (!isRuleConditionTrue(ctx, rule)) continue;
    for (const action of rule.actions) {
      ctx.dispatch(action.actuatorId, action.command);
    }
  }
}
