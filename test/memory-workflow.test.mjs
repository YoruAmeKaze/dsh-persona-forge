import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { approveResearchFact } from '../src/memory-workflow.mjs';

test('promotes a sourced research fact into approved runtime memory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-memory-'));
  await mkdir(path.join(root, 'personas', 'demo', 'memory'), { recursive: true });
  await writeFile(path.join(root, 'personas', 'demo', 'memory', 'index.json'), JSON.stringify({ entries: [], conflicts: [], lastReviewedAt: null }));
  const entry = await approveResearchFact(root, 'demo', { id: 'fact-1', claim: 'confirmed', sourceIds: ['source-1'], confidence: 'medium' });
  assert.equal(entry.status, 'approved');
  const memory = JSON.parse(await readFile(path.join(root, 'personas', 'demo', 'memory', 'index.json'), 'utf8'));
  assert.equal(memory.entries[0].content, 'confirmed');
});
