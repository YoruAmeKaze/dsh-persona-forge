# Phase 2 Research Workflow

## Delivered

- `src/research-workflow.mjs` defines subject classification, source categories, source validation, fact validation, and research persistence.
- Each persona now has `research/sources.json`, `research/facts.json`, and `research/conflicts.json`.
- Facts must reference recorded source ids. Unknown references fail the write.
- Conflicts remain explicit records with an open status until a later review resolves them.
- `classifySubject()` provides a conservative initial category; the result includes confidence so a user or later model step can confirm it.

## Research record contract

Sources include an id, title, URL, collection time, primary-source flag, and confidence. Facts include an id, claim, source ids, record time, and confidence. This keeps the generated persona traceable to evidence and prevents unsupported facts from silently entering the memory bank.

The workflow is local and deterministic. Network acquisition is intentionally left to a future adapter that will supply normalized source records. It can therefore be tested without API keys, browser automation, or a live website.

## Verification

```text
npm test
4 tests passed
```

## Phase 3 entry criteria

Phase 3 can consume facts and conflicts to generate reviewable persona revisions, scenario tests, version history, and rollback operations. It should keep research records immutable by append/update policy and store generated persona changes as explicit versions.

