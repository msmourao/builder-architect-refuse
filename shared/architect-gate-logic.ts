export type ArchitectRisk =
  | "none"
  | "secrets"
  | "destructive-sql"
  | "force-push"
  | "broad-rewrite"
  | "unclear-locate";

export type ArchitectGateInput = {
  intent: string;
  locatedPaths: string[];
  confidence: number;
  risk: ArchitectRisk;
  diagnosis?: string;
};

export type ArchitectGateResult = {
  stage: "apply" | "refuse";
  decision: "apply" | "refuse";
  intent: string;
  locate: {
    paths: string[];
    hitCount: number;
    confidence: number;
  };
  diagnosis: string;
  reason: string;
  nextStep: string;
  allowedPaths?: string[];
};

/**
 * Deterministic Locate → Diagnose → Apply|Refuse.
 * Shared by the defineAction handler and unit tests.
 */
export function runArchitectGate(input: ArchitectGateInput): ArchitectGateResult {
  const { intent, locatedPaths, confidence, risk, diagnosis } = input;
  const locate = {
    paths: locatedPaths,
    hitCount: locatedPaths.length,
    confidence,
  };

  const hardRisk =
    risk === "secrets" ||
    risk === "destructive-sql" ||
    risk === "force-push";

  if (hardRisk) {
    return {
      stage: "refuse",
      decision: "refuse",
      intent,
      locate,
      diagnosis:
        diagnosis ??
        `Risk flag "${risk}" is not allowed without explicit human approval.`,
      reason: `Refuse: ${risk} is out of policy for unattended Apply.`,
      nextStep: "Ask the user to confirm, or narrow the change to a safer path.",
    };
  }

  if (locatedPaths.length === 0 || risk === "unclear-locate") {
    return {
      stage: "refuse",
      decision: "refuse",
      intent,
      locate,
      diagnosis:
        diagnosis ??
        "Locate returned no durable paths — refusing to invent a patch target.",
      reason: "Refuse: empty Locate. Do not Apply without evidence.",
      nextStep: "Re-run Locate (search/view-screen) or ask the user for the file.",
    };
  }

  if (confidence < 0.4) {
    return {
      stage: "refuse",
      decision: "refuse",
      intent,
      locate,
      diagnosis:
        diagnosis ??
        `Locate confidence ${confidence} is below the 0.4 threshold.`,
      reason: "Refuse: low-confidence Locate.",
      nextStep: "Gather more evidence or ask a clarifying question.",
    };
  }

  if (risk === "broad-rewrite" && confidence < 0.75) {
    return {
      stage: "refuse",
      decision: "refuse",
      intent,
      locate,
      diagnosis:
        diagnosis ??
        "Broad rewrite with mid confidence — prefer a smaller patch.",
      reason: "Refuse: broad-rewrite needs confidence ≥ 0.75.",
      nextStep: "Split into a single-file change and re-gate.",
    };
  }

  return {
    stage: "apply",
    decision: "apply",
    intent,
    locate,
    diagnosis:
      diagnosis ??
      `Locate hit ${locatedPaths.length} path(s) at confidence ${confidence}.`,
    reason: "Apply: Locate evidence is sufficient and risk is within policy.",
    nextStep: `Edit only: ${locatedPaths.slice(0, 3).join(", ")}`,
    allowedPaths: locatedPaths,
  };
}
