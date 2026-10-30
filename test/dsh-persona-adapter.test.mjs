import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createPersonaPromptHandler, switchPersonaForRuntime } from '../src/dsh-persona-adapter.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-adapter-'));
  const dir = path.join(root, 'personas', 'demo');
  for (const part of ['identity', 'style', 'memory']) await mkdir(path.join(dir, part), { recursive: true });
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ id: 'demo', name: 'Demo', version: 1, updatedAt: '2026-10-30T00:00:00.000Z' }));
  await writeFile(path.join(dir, 'identity', 'personality.md'), 'precise');
  await writeFile(path.join(dir, 'style', 'speech-rules.md'), 'short');
  await writeFile(path.join(dir, 'memory', 'index.json'), '{}');
  await writeFile(path.join(root, 'active-persona.json'), JSON.stringify({ id: 'demo', version: 1 }));
  return root;
}

test('injects the active persona at every prompt assembly', async () => {
  const root = await fixture();
  const handler = createPersonaPromptHandler(root);
  const result = await handler(null, { agent: {} }, async () => ({ sections: [] }));
  assert.equal(result.sections[0].name, 'persona-forge:active-persona');
  assert.match(result.sections[0].text, /Demo/);
});

test('reports the session policy when switching personas', async () => {
  const root = await fixture();
  const result = await switchPersonaForRuntime(root, 'demo', 1);
  assert.equal(result.sessionPolicy, 'new-session-required');
});
