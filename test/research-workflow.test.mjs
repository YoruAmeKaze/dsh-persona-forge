import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { classifySubject, recordResearch, SOURCE_CATEGORIES } from '../src/research-workflow.mjs';

test('classifies a fictional subject and exposes source templates', () => {
  assert.equal(classifySubject('小说角色 林冲').category, 'fictional');
  assert.ok(SOURCE_CATEGORIES.fictional.includes('original-work'));
});

test('records sources, facts, and conflicts with provenance', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-research-'));
  const now = '2026-10-30T00:00:00.000Z';
  const result = await recordResearch(root, 'lu-xun', {
    category: 'historical',
    source: { id: 'source-archive', title: 'Archive record', url: 'https://example.com/archive', collectedAt: now, isPrimary: true, confidence: 'high' },
    facts: [{ id: 'fact-birth', claim: 'A documented biographical fact.', sourceIds: ['source-archive'], recordedAt: now, confidence: 'high' }],
    conflicts: [{ id: 'conflict-1', topic: 'Date discrepancy', claims: ['Claim A', 'Claim B'] }],
  });
  assert.deepEqual(result, { sourceCount: 1, factCount: 1, conflictCount: 1 });
  const sources = JSON.parse(await readFile(path.join(root, 'personas', 'lu-xun', 'research', 'sources.json'), 'utf8'));
  assert.equal(sources.items[0].isPrimary, true);
  await assert.rejects(() => recordResearch(root, 'lu-xun', {
    source: { id: 'source-bad', title: 'Bad', url: 'https://example.com', collectedAt: now, isPrimary: false, confidence: 'low' },
    facts: [{ id: 'fact-bad', claim: 'Unlinked', sourceIds: ['missing'], recordedAt: now, confidence: 'low' }],
  }), /unknown source/);
});
