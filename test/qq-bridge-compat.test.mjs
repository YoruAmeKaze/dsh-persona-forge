import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { exportToQqBridge } from '../src/qq-bridge-compat.mjs';

test('exports the generated persona to qq-bridge role format and activates it', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-bridge-'));
  const bridge = await mkdtemp(path.join(os.tmpdir(), 'qq-bridge-'));
  const dir = path.join(root, 'personas', 'demo');
  for (const part of ['identity', 'style', 'memory']) await mkdir(path.join(dir, part), { recursive: true });
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ id: 'demo', name: 'Demo', version: 2, updatedAt: '2026-10-30T00:00:00.000Z' }));
  await writeFile(path.join(dir, 'identity', 'personality.md'), 'calm and playful');
  await writeFile(path.join(dir, 'style', 'speech-rules.md'), 'short sentences');
  await writeFile(path.join(dir, 'memory', 'index.json'), JSON.stringify({ entries: [] }));
  const result = await exportToQqBridge(root, 'demo', bridge, { activate: true });
  assert.equal(result.activated, true);
  assert.match(await readFile(path.join(bridge, 'roles', '蓝色大肥鱼.md'), 'utf8'), /calm and playful/);
  assert.deepEqual(JSON.parse(await readFile(path.join(bridge, 'state', 'current-role.json'), 'utf8')), { role: '蓝色大肥鱼', mode: 'active' });
});
