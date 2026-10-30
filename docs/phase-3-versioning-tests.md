# Phase 3 Versioning and Persona Tests

## Delivered

- `src/persona-versions.mjs` creates versioned persona snapshots under `versions/vN`.
- Revision metadata records author, timestamp, note, and snapshot path.
- `rollbackRevision()` restores a selected snapshot and records a rollback marker.
- `compareRevisions()` reports changes across personality, style, and memory.
- `evaluateScenario()` runs deterministic include and avoid assertions against a response.
- The active package includes starter scenarios under `tests/scenarios.json`.

## Safety rules

Every revision increments the manifest version and preserves the previous state in a snapshot. A rollback requires an existing snapshot version and leaves an audit marker. Scenario checks are deliberately small and deterministic; they provide a local gate before a later DSH-backed conversation test.

## Verification

```text
npm test
6 tests passed
```

## Phase 4 entry criteria

Phase 4 can add visual asset metadata, download normalization, deduplication, user confirmation, and QQ media delivery. Visual assets should follow the same provenance and versioning rules used by research records.

