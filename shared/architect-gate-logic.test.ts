import { describe, expect, it } from "vitest";

import { runArchitectGate } from "./architect-gate-logic";

describe("runArchitectGate", () => {
  it("refuses when Locate is empty", () => {
    const result = runArchitectGate({
      intent: "patch login",
      locatedPaths: [],
      confidence: 0.9,
      risk: "none",
    });
    expect(result.decision).toBe("refuse");
    expect(result.reason).toMatch(/empty Locate/i);
  });

  it("refuses hard risk even with paths", () => {
    const result = runArchitectGate({
      intent: "rotate secrets",
      locatedPaths: ["server/secrets.ts"],
      confidence: 0.95,
      risk: "secrets",
    });
    expect(result.decision).toBe("refuse");
    expect(result.reason).toMatch(/secrets/i);
  });

  it("refuses low confidence", () => {
    const result = runArchitectGate({
      intent: "rename helper",
      locatedPaths: ["app/lib/x.ts"],
      confidence: 0.2,
      risk: "none",
    });
    expect(result.decision).toBe("refuse");
    expect(result.reason).toMatch(/low-confidence/i);
  });

  it("applies when locate + confidence + risk are ok", () => {
    const result = runArchitectGate({
      intent: "fix typo in gate",
      locatedPaths: ["actions/architect-gate.ts"],
      confidence: 0.8,
      risk: "none",
    });
    expect(result.decision).toBe("apply");
    expect(result.allowedPaths).toEqual(["actions/architect-gate.ts"]);
  });

  it("refuses broad-rewrite below 0.75 confidence", () => {
    const result = runArchitectGate({
      intent: "rewrite module",
      locatedPaths: ["app/routes/home.tsx"],
      confidence: 0.5,
      risk: "broad-rewrite",
    });
    expect(result.decision).toBe("refuse");
    expect(result.reason).toMatch(/broad-rewrite/i);
  });
});
