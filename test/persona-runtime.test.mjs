import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { composePersonaPrompt, loadActivePersona, readActivePersona, switchActivePersona } from '../src/persona-runtime.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-forge-'));
  const dir = path.join(root, 'personas', 'lu-xun');
  await mkdir(path.join(dir, 'identity'), { recursive: true });
  await mkdir(path.join(dir, 'style'), { recursive: true });
  await mkdir(path.join(dir, 'memory'), { recursive: true });
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ id: 'lu-xun', name: '鲁迅', version: 1, updatedAt: '2026-10-30T00:00:00.000Z' }));
  await writeFile(path.join(dir, 'identity', 'personality.md'), '冷静，观察细密。');
  await writeFile(path.join(dir, 'style', 'speech-rules.md'), '简洁，有讽刺意味，但不重复固定口头禅。');
  await writeFile(path.join(dir, 'memory', 'index.json'), JSON.stringify({ entries: [], conflicts: [] }));
  return root;
}

test('switches atomically and loads the active persona', async () => {
  const root = await fixture();
  const persona = await switchActivePersona(root, 'lu-xun');
  assert.equal(persona.manifest.id, 'lu-xun');
  assert.deepEqual((await readActivePersona(root)).id, 'lu-xun');
  assert.equal((await loadActivePersona(root)).manifest.version, 1);
  assert.match(composePersonaPrompt(persona), /鲁迅/);
  assert.match(await readFile(path.join(root, 'active-persona.json'), 'utf8'), /"version": 1/);
});

test('rejects stale active state', async () => {
  const root = await fixture();
  await switchActivePersona(root, 'lu-xun');
  const activePath = path.join(root, 'active-persona.json');
  await writeFile(activePath, JSON.stringify({ id: 'lu-xun', version: 2 }));
  await assert.rejects(loadActivePersona(root), /stale/);
});
