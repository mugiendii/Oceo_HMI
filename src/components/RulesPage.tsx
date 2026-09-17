import type { ActuatorCommand, Rule, RuleOperator } from "../types/site";
import type { RuleContext } from "../rules/types";
import { isRuleConditionTrue } from "../rules/ruleEngine";
import { uid } from "../lib/uid";

interface RulesPageProps {
  rules: Rule[];
  ctx: RuleContext;
  onChangeRules: (rules: Rule[]) => void;
}

const OPERATORS: RuleOperator[] = [">=", "<=", ">", "<", "=="];

const selectClass =
  "bg-scada-panel border border-scada-border rounded-md px-2 py-1 text-xs font-mono text-scada-text focus:outline-none focus:border-scada-blue";

export function RulesPage({ rules, ctx, onChangeRules }: RulesPageProps) {
  function addRule() {
    const firstSensor = ctx.sensors[0];
    const firstActuator = ctx.actuators[0];
    const rule: Rule = {
      id: uid("rule"),
      name: `Rule ${rules.length + 1}`,
      // Starts disabled -- a fresh rule's condition/action are meaningless
      // defaults, and the engine evaluates every enabled rule once a second
      // regardless of whether the operator is still editing it.
      enabled: false,
      condition: { sensorId: firstSensor?.id ?? "", operator: ">=", value: 0 },
      actions: firstActuator ? [{ actuatorId: firstActuator.id, command: "off" }] : [],
    };
    onChangeRules([...rules, rule]);
  }

  function updateRule(id: string, patch: Partial<Rule>) {
    onChangeRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function updateCondition(id: string, patch: Partial<Rule["condition"]>) {
    onChangeRules(rules.map((r) => (r.id === id ? { ...r, condition: { ...r.condition, ...patch } } : r)));
  }

  function addAction(id: string) {
    const firstActuator = ctx.actuators[0];
    if (!firstActuator) return;
    onChangeRules(
      rules.map((r) => (r.id === id ? { ...r, actions: [...r.actions, { actuatorId: firstActuator.id, command: "off" as ActuatorCommand }] } : r)),
    );
  }

  function updateAction(id: string, index: number, patch: Partial<Rule["actions"][number]>) {
    onChangeRules(
      rules.map((r) => (r.id === id ? { ...r, actions: r.actions.map((a, i) => (i === index ? { ...a, ...patch } : a)) } : r)),
    );
  }

  function removeAction(id: string, index: number) {
    onChangeRules(rules.map((r) => (r.id === id ? { ...r, actions: r.actions.filter((_, i) => i !== index) } : r)));
  }

  function deleteRule(id: string) {
    onChangeRules(rules.filter((r) => r.id !== id));
  }

  return (
    <div className="panel-bevel rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Automation Rules</h3>
        <button
          onClick={addRule}
          disabled={ctx.sensors.length === 0}
          className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add Rule
        </button>
      </div>

      {ctx.sensors.length === 0 && (
        <p className="text-xs text-scada-text-dim">No sensors on this site yet — add one before writing a rule.</p>
      )}
      {rules.length === 0 && ctx.sensors.length > 0 && (
        <p className="text-xs text-scada-text-dim">No rules yet. Click "+ Add Rule" to build one.</p>
      )}

      <div className="flex flex-col gap-3">
        {rules.map((rule) => {
          const sensor = ctx.sensors.find((s) => s.id === rule.condition.sensorId);
          const conditionTrue = isRuleConditionTrue(ctx, rule);
          return (
            <div key={rule.id} className="rounded-md border border-scada-border/60 p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                  <input type="checkbox" checked={rule.enabled} onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })} />
                  <input
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    className="bg-transparent border-b border-transparent hover:border-scada-border focus:border-scada-blue focus:outline-none text-sm font-semibold text-scada-text px-1"
                  />
                </div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${conditionTrue ? "text-scada-green" : "text-scada-text-dim"}`}>
                  ● {conditionTrue ? "Condition True" : "Condition False"}
                </span>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border border-scada-red text-scada-red hover:bg-scada-red-dim/30 transition-colors"
                >
                  Delete
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-scada-text-dim">
                <span className="font-bold uppercase tracking-wide text-[10px]">If</span>
                <select className={selectClass} value={rule.condition.sensorId} onChange={(e) => updateCondition(rule.id, { sensorId: e.target.value })}>
                  {ctx.sensors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={rule.condition.operator}
                  onChange={(e) => updateCondition(rule.id, { operator: e.target.value as RuleOperator })}
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className={`${selectClass} w-24`}
                  value={rule.condition.value}
                  onChange={(e) => updateCondition(rule.id, { value: Number(e.target.value) })}
                />
                <span className="font-mono">{sensor?.unit ?? ""}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold uppercase tracking-wide text-[10px] text-scada-text-dim">Then</span>
                {rule.actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 flex-wrap">
                    <select className={selectClass} value={action.actuatorId} onChange={(e) => updateAction(rule.id, index, { actuatorId: e.target.value })}>
                      {ctx.actuators.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={action.command}
                      onChange={(e) => updateAction(rule.id, index, { command: e.target.value as ActuatorCommand })}
                    >
                      <option value="on">Turn ON</option>
                      <option value="off">Turn OFF</option>
                    </select>
                    <button onClick={() => removeAction(rule.id, index)} className="text-[10px] text-scada-text-dim hover:text-scada-red transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addAction(rule.id)}
                  disabled={ctx.actuators.length === 0}
                  className="text-[10px] font-bold uppercase tracking-wide text-scada-blue hover:text-scada-text transition-colors self-start disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + Add Action
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
