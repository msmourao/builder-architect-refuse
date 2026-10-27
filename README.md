# Architect Refuse

Agent-Native hackathon entry: a shared **`architect-gate`** action that forces
**Locate → Diagnose → Apply|Refuse** before risky edits. The React UI and the
agent call the same `defineAction` — not a chat-only prompt.

**Repo:** https://github.com/msmourao/builder-architect-refuse  
**Hackathon:** [Builder Agent-Native](https://www.builder.io/hackathon) · submit by **2026-11-09 23:59 PT**

## Why it exists

Coding agents invent patch targets when Locate is empty. `architect-gate` is a
deterministic policy gate:

| Input | Decision |
|-------|----------|
| Empty `locatedPaths` / `unclear-locate` | **Refuse** |
| Risk `secrets` / `destructive-sql` / `force-push` | **Refuse** |
| Confidence &lt; 0.4 | **Refuse** |
| `broad-rewrite` with confidence &lt; 0.75 | **Refuse** |
| Paths + confidence ≥ 0.4 + safe risk | **Apply** (scoped paths) |

Logic lives in `shared/architect-gate-logic.ts` and is exposed as
`actions/architect-gate.ts` (`mcpTool: true`, POST).

## Demo (local)

```bash
corepack enable
pnpm install
pnpm dev
```

Open `/home`. Use the **Try architect-gate** buttons (no LLM required), or ask
chat to run `architect-gate` on a risky edit (needs a connected model provider).

```bash
pnpm test
pnpm action architect-gate --intent "patch login" --risk unclear-locate
```

## Hosting

Production needs `DATABASE_URL` (Postgres) + `BETTER_AUTH_SECRET`. Neon is
provisioned for this entry (secrets local only). Planned public host: **Azure**
(Container Apps / App Service) when we publish — not required to record Clips.
See [Agent-Native deploy](https://www.agent-native.com/docs/deploy-an-app);
`Dockerfile` + `netlify.toml` are in-repo for later.

## Clips + submit checklist

1. Record a **public Clips** demo: https://www.agent-native.com/apps/clips/
2. Show home gate panel (Refuse empty → Refuse secrets → Apply) then one chat turn.
3. Submit: https://www.builder.io/hackathon/submit  
   - Project name: **Architect Refuse**  
   - GitHub: this repo  
   - Clips URL: https://clips.agent-native.com/r/OucjSH7d8BbY

## Scaffold

Built from `@agent-native/core` Chat template (`0.220.0`). Framework docs:
https://www.agent-native.com/docs
