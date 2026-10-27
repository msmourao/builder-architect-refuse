import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { runArchitectGate } from "../shared/architect-gate-logic";

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
  run: async ({ intent, locatedPaths, confidence, risk, diagnosis }) =>
    runArchitectGate({ intent, locatedPaths, confidence, risk, diagnosis }),
});
