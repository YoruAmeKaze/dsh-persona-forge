# Persona Forge

Persona Forge is a local, single-user workspace for building, testing, and deploying AI personas through the official Tencent DSH QQBot plugin.

## Project status

Phase 0 source audit is complete. Implementation starts only after the DSH integration boundary is recorded in [docs/phase-0-source-audit.md](docs/phase-0-source-audit.md).

## Phase plan

- Phase 0: audit the official DSH QQBot source and record verified integration points.
- Phase 1: add the smallest runtime-safe persona asset package and current-persona state.
- Phase 2: add research and persona assembly workflows.
- Phase 3: add persona testing, editing, versioning, and rollback. (complete)
- Phase 4: add visual asset collection and QQ media delivery. (core asset workflow complete)
- Phase 5: add runtime orchestration, recovery, and stability tests. (adapter complete)

## Scope

The first release targets one local user and one QQ Bot account. The workspace contains one persona package: 蓝色大肥鱼（DeepSeek娘）.

