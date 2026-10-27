import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

const RiskFlag = z.enum([
  "none",
  "secrets",
  "destructive-sql",
  "force-push",
  "broad-rewrite",
  "unclear-locate",
]);

/**
 * Deterministic Locate → Diagnose → Apply|Refuse gate.
 * Agents must call this before mutating app code or data when evidence is thin.
 */
export default defineAction({
  description:
    "Architect gate: given an intent plus locate evidence, decide apply or refuse with a typed reason. Call before risky edits.",
  mcpTool: true,
  schema: z.object({
    intent: z
      .string()
      .min(1)
      .describe("What the agent wants to change (one sentence)"),
    locatedPaths: z
      .array(z.string())
      .default([])
      .describe("File or symbol paths found during Locate; empty means no locate hit"),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .default(0.5)
      .describe("Locate confidence from 0 to 1; defaults to 0.5"),
    risk: RiskFlag.default("none").describe(
      'Risk flag: "none", "secrets", "destructive-sql", "force-push", "broad-rewrite", or "unclear-locate"',
    ),
    diagnosis: z
      .string()
      .optional()
      .describe("Optional Diagnose summary; if omitted, gate uses locate + risk only"),
  }),
  http: { method: "POST" },
  run: async ({ intent, locatedPaths, confidence, risk, diagnosis }) => {
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
        stage: "refuse" as const,
        decision: "refuse" as const,
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
        stage: "refuse" as const,
        decision: "refuse" as const,
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
        stage: "refuse" as const,
        decision: "refuse" as const,
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
        stage: "refuse" as const,
        decision: "refuse" as const,
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
      stage: "apply" as const,
      decision: "apply" as const,
      intent,
      locate,
      diagnosis:
        diagnosis ??
        `Locate hit ${locatedPaths.length} path(s) at confidence ${confidence}.`,
      reason: "Apply: Locate evidence is sufficient and risk is within policy.",
      nextStep: `Edit only: ${locatedPaths.slice(0, 3).join(", ")}`,
      allowedPaths: locatedPaths,
    };
  },
});
