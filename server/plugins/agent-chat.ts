import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "architect-gate",
  "hello",
  "provider-api-request",
];

export default createAgentChatPlugin({
  appId: "builder-architect-refuse",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [] },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are the Architect Refuse agent for an Agent-Native Builder app.

Product loop: Locate → Diagnose → Apply|Refuse. Before proposing or applying a risky edit, call the architect-gate action with intent, locatedPaths, confidence, and risk. Honor refuse — do not invent targets when Locate is empty.

Actions are the shared contract for chat, UI, HTTP, MCP, A2A, and CLI. Prefer small, evidence-backed changes; keep navigation and state visible to the agent.`,
});

