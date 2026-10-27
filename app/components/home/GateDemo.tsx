import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ScenarioId = "refuse-empty" | "refuse-secrets" | "apply";

type Scenario = {
  id: ScenarioId;
  label: string;
  intent: string;
  locatedPaths: string[];
  confidence: number;
  risk:
    | "none"
    | "secrets"
    | "destructive-sql"
    | "force-push"
    | "broad-rewrite"
    | "unclear-locate";
};

const SCENARIOS: Scenario[] = [
  {
    id: "refuse-empty",
    label: "Refuse — empty Locate",
    intent: "Patch the login form without knowing the file",
    locatedPaths: [],
    confidence: 0.9,
    risk: "none",
  },
  {
    id: "refuse-secrets",
    label: "Refuse — secrets risk",
    intent: "Rotate production API keys in place",
    locatedPaths: ["server/secrets.ts"],
    confidence: 0.95,
    risk: "secrets",
  },
  {
    id: "apply",
    label: "Apply — clear Locate",
    intent: "Fix a typo in architect-gate",
    locatedPaths: ["actions/architect-gate.ts"],
    confidence: 0.85,
    risk: "none",
  },
];

type GateResult = {
  decision: string;
  reason: string;
  nextStep: string;
  locate?: { paths: string[]; confidence: number };
};

/**
 * Calls the same `architect-gate` defineAction the agent uses — no LLM needed.
 * Good for Clips demos and judges who want Apply|Refuse proof in one click.
 */
export default function GateDemo() {
  const gate = useActionMutation("architect-gate");
  const [activeId, setActiveId] = useState<ScenarioId | null>(null);
  const [result, setResult] = useState<GateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScenario(scenario: Scenario) {
    setActiveId(scenario.id);
    setError(null);
    setResult(null);
    try {
      const data = await gate.mutateAsync({
        intent: scenario.intent,
        locatedPaths: scenario.locatedPaths,
        confidence: scenario.confidence,
        risk: scenario.risk,
      });
      setResult(data as GateResult);
    } catch (err) {
      setError(actionErrorMessage(err) ?? "Gate call failed.");
    }
  }

  const decision = result?.decision;
  const decisionClass =
    decision === "apply"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : decision === "refuse"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <section
      aria-label="Architect gate demo"
      className="w-full max-w-2xl rounded-xl border border-border/80 bg-background/80 p-4 text-start shadow-sm backdrop-blur sm:p-5"
    >
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-sm font-semibold tracking-tight">
          Try `architect-gate` (shared action)
        </h2>
        <p className="text-sm text-muted-foreground">
          Same `defineAction` the agent must call before risky edits. No chat
          model required.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((scenario) => (
          <Button
            key={scenario.id}
            type="button"
            size="sm"
            variant={activeId === scenario.id ? "default" : "outline"}
            disabled={gate.isPending}
            onClick={() => void runScenario(scenario)}
          >
            {scenario.label}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className={`mt-3 space-y-1 rounded-lg border px-3 py-2 font-mono text-xs sm:text-sm ${decisionClass}`}
          role="status"
        >
          <p>
            <span className="opacity-70">decision:</span> {result.decision}
          </p>
          <p>
            <span className="opacity-70">reason:</span> {result.reason}
          </p>
          <p>
            <span className="opacity-70">next:</span> {result.nextStep}
          </p>
          {result.locate ? (
            <p>
              <span className="opacity-70">locate:</span>{" "}
              {result.locate.paths.length
                ? result.locate.paths.join(", ")
                : "(empty)"}{" "}
              @ {result.locate.confidence}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Pick a scenario to see Apply or Refuse from the live action.
        </p>
      )}
    </section>
  );
}
