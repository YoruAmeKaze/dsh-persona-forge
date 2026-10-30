import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRevision, evaluateScenario, listVersions, rollbackRevision } from '../src/persona-versions.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-versions-'));
  const dir = path.join(root, 'personas', 'demo');
  for (const part of ['identity', 'style', 'memory']) await mkdir(path.join(dir, part), { recursive: true });
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ id: 'demo', name: 'Demo', version: 1, updatedAt: '2026-10-30T00:00:00.000Z' }));
  await writeFile(path.join(dir, 'identity', 'personality.md'), 'calm');
  await writeFile(path.join(dir, 'style', 'speech-rules.md'), 'short');
  await writeFile(path.join(dir, 'memory', 'index.json'), JSON.stringify({ entries: [] }));
  return root;
}

test('creates a version and rolls back to its snapshot', async () => {
  const root = await fixture();
  const revision = await createRevision(root, 'demo', { personality: 'calm and precise', note: 'add precision' });
  assert.equal(revision.version, 2);
  assert.equal((await listVersions(root, 'demo')).length, 1);
  const rollback = await rollbackRevision(root, 'demo', 2, { note: 'restore tested version' });
  assert.equal(rollback.manifest.version, 2);
  assert.equal((await listVersions(root, 'demo'))[0].version, 2);
});

test('evaluates scenario include and avoid assertions', () => {
  assert.deepEqual(evaluateScenario('calm answer', { id: 'tone', mustInclude: ['calm'], mustAvoid: ['angry'] }).passed, true);
  assert.equal(evaluateScenario('angry answer', { id: 'tone', mustInclude: ['calm'], mustAvoid: ['angry'] }).passed, false);
});
