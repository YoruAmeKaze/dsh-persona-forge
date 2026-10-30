# Phase 5 Runtime Integration

## Delivered

- `src/dsh-persona-adapter.mjs` implements the official DSH `system-prompt/assemble` integration shape.
- The handler reloads `active-persona.json` and the current package for every prompt assembly, so a future running DSH host can observe a switched persona on new session work without changing `cordis.yml`.
- `switchPersonaForRuntime()` reports `new-session-required` because the official plugin locks preset and prompt composition to a session boundary.
- Existing DSH QQ transport, SessionManager, and outbound media handling remain the owners of QQ communication.

## Integration contract

An owning Cordis plugin can register the handler with:

```js
registerPersonaPrompt(ctx, workspaceRoot)
```

The host must call the switch operation through an explicit command or service. It should then reset or rebuild the affected DSH sessions according to the official SessionManager policy. The adapter does not mutate `cordis.yml`, create a second QQ transport, or merge histories across personas.

## Verification

```text
npm test
10 tests passed
```

Live DSH, QQ, and DeepSeek calls remain unverified because this workspace has no bot credentials or DSH host process. The adapter is ready for a credentialed integration smoke test.

