# Phase 0 Source Audit

## Audit scope

This audit checks the official repository `tencent-connect/dsh-qqbot` before any Persona Forge implementation. The inspected source was downloaded from the `main` branch on 2026-10-30.

| Item | Verified value |
| --- | --- |
| Repository | `https://github.com/tencent-connect/dsh-qqbot` |
| Commit | `e5902f6857f91b00581b584907f63f7295dd4b47` |
| Package | `@tencent-connect/dsh-qqbot` |
| Version | `0.5.4` |
| Runtime requirement | Node `>=20.3.0` |

## Verified integration points

### DSH and QQ message flow

The official README describes the flow as QQ user -> QQ WebSocket -> `dsh-qqbot` -> `ctx.agents` -> DSH agent loop -> LLM. In source, `src/gateway/bootstrap.ts` creates the QQ bot and registers the middleware chain. The post-middleware `message` event calls `handleInbound`.

`src/transport/inbound.ts` then:

1. Classifies a message as `c2c` or `group`.
2. Uses the sender OpenID as the C2C peer id.
3. Uses `groupOpenid` as the group peer id, with sender id only as a fallback.
4. Resolves or creates a session through `SessionManager.getOrCreate`.
5. Creates a DSH user message and calls `record.agent.followup(message)`.
6. Waits for `record.agent.whenIdle()` before the next message for that peer proceeds.

The outbound path in `src/transport/outbound.ts` listens for `session/event` and resolves the session id back to the `SessionRecord`. It sends assistant text with `sendMarkdown`, supports stream frames, and handles turn completion and media delivery.

### Session identity and isolation

`src/session/session-manager.ts` uses this key format:

```text
qqbot:<appId>:<scope>:<peerId>
```

The source documents the mapping as:

- C2C: `peerId = senderId` (user OpenID)
- Group: `peerId = groupOpenid`

The session id is initially derived deterministically from the session key with SHA-256. A minted id is persisted after migration, fork, or session reset. This gives Persona Forge a stable boundary for associating a persona runtime with the official session manager without replacing QQ transport.

### Prompt injection

The constructor registers a `system-prompt/assemble` handler. For every turn, the handler finds the active `SessionRecord` by agent and appends a prompt section with order `90`. The current plugin uses this mechanism for `groupPrompt` and `directPrompt`.

This is the verified extension point for Persona Forge's runtime persona prompt. The persona prompt should be assembled by a small independent service and appended through this event. It should not modify `cordis.yml` on each persona switch.

### Preset loading

`SessionManager.composePreset` obtains the optional `agentPresets` service from the Cordis context. It calls `resolve(presetId)` and provides a setup hook that calls `mount(agentCtx, resolvedId)`. The same composition is passed to both `agents.resume` and `agents.create`.

The source also records a session's original `agentPreset` in persisted session metadata and prefers that value when resuming. A preset override is therefore a session-start setting; the existing plugin explicitly reports that an active session remains locked until a new session or rebuild.

### Current configuration and plugin composition

The official `cordis.yml` composes the following relevant services:

- `@deepseek-ai/dsh-session`
- `@deepseek-ai/dsh-agent`
- `@deepseek-ai/dsh-agent-loop`
- `@deepseek-ai/dsh-system-prompt`
- `@deepseek-ai/dsh-agent-presets`
- `@deepseek-ai/dsh-session-persistence-jsonl`
- `@tencent-connect/dsh-qqbot`

The QQ plugin accepts `preset`, `cwd`, `groupPrompt`, `directPrompt`, media, vision, access control, and session timeout settings. The official README lists `/preset` as taking effect for a new session.

## Design decisions for Persona Forge

1. Keep the official DSH QQBot plugin as the QQ transport and session owner.
2. Implement persona assets and current-persona state in the Persona Forge workspace.
3. Integrate at `system-prompt/assemble` and the existing agent/preset services.
4. Keep one global current persona for the single QQ Bot account. Do not add per-group personas or multi-bot management.
5. Preserve all persona packages when switching. Switching must update explicit runtime state and trigger a controlled session policy.
6. Treat session history and persona state as separate concerns. Persona switching must not silently merge unrelated persona histories.
7. Keep source provenance, confidence, and unresolved conflicts in persona assets so later research and testing can be audited.

## Boundaries not yet verified

- The current DSH host API for registering a custom Persona Forge Cordis plugin has not yet been exercised in a running DSH process.
- Whether the host can hot-reload an externally mounted prompt section without rebuilding a session needs a Phase 1 integration smoke test.
- QQ media upload behavior is present in the official plugin, but Persona Forge has not yet tested the exact asset formats and size limits end to end.
- No QQ credentials or DeepSeek credentials are available in this workspace, so live QQ and LLM calls remain unverified.

## Phase 0 exit criteria

- [x] Official repository reachable and source snapshot recorded.
- [x] Agent/session creation and resume paths located.
- [x] C2C and group session identity verified from source.
- [x] Prompt assembly extension point verified from source.
- [x] Preset resolve/mount behavior located.
- [x] QQ inbound and outbound paths located.
- [x] Unverified runtime boundaries listed explicitly.

Phase 1 can now begin with the persona asset schema, `active-persona.json` state, and a minimal prompt assembly plugin.

