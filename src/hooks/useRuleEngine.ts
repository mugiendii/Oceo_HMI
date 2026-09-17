import { useEffect, useRef } from "react";
import type { Rule } from "../types/site";
import type { RuleContext } from "../rules/types";
import { evaluateRules } from "../rules/ruleEngine";

const TICK_MS = 1000;

/**
 * Ticks evaluateRules() once a second. `ctx` is rebuilt fresh every render
 * by the adapters in rules/adapters.ts, so its identity changes constantly
 * -- keeping it in a ref (rather than the effect's dependency array) means
 * the interval is only ever torn down/rebuilt when `paused` actually
 * changes, instead of restarting (and never firing) on every render.
 */
export function useRuleEngine(ctx: RuleContext, rules: Rule[], paused: boolean) {
  const ctxRef = useRef(ctx);
  const rulesRef = useRef(rules);

  // Refs must be written in an effect, not during render -- this one runs
  // after every commit (no dependency array) purely to keep them current
  // for the interval below.
  useEffect(() => {
    ctxRef.current = ctx;
    rulesRef.current = rules;
  });

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => evaluateRules(ctxRef.current, rulesRef.current), TICK_MS);
    return () => clearInterval(id);
  }, [paused]);
}
