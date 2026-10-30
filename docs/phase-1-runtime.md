# Phase 1 Runtime Foundation

## Delivered

- `src/persona-runtime.mjs` provides manifest validation, persona loading, active-persona reading, atomic switching, active-state validation, and prompt composition.
- `personas/da-fei-yu/` is the active package with identity, style, memory, and research files.
- `active-persona.json` records one global active persona and its package version.
- `test/persona-runtime.test.mjs` covers a successful switch/load path and stale-state rejection.

## Runtime contract

Persona packages live under `personas/<id>/`. The package must contain:

```text
manifest.json
identity/personality.md
style/speech-rules.md
memory/index.json
```

`manifest.json` requires a lowercase hyphen-safe id, a display name, a positive integer version, and an ISO timestamp. The runtime refuses invalid ids and malformed manifests.

`active-persona.json` is the single current-persona pointer. Switching first loads and validates the target package, writes a process-specific temporary file, and atomically renames it into place. A running process must reject an active pointer whose version no longer matches its package.

## DSH integration boundary

The runtime currently has no QQ or LLM dependency. Phase 1 deliberately proves the local state model first. The next adapter should call `loadActivePersona()` from a Cordis `system-prompt/assemble` handler, using the verified official DSH extension point documented in Phase 0.

## Verification

```text
npm test
2 tests passed
```

## Phase 2 entry criteria

Phase 2 adds source records and research workflows without changing the active-persona contract. Research output updates versioned package files and preserves provenance, confidence, source URL, and conflicts.

