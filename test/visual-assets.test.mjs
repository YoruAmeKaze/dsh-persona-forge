import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listSendableAssets, registerAsset, setAssetState } from '../src/visual-assets.mjs';

test('registers, deduplicates, confirms, and filters visual assets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-assets-'));
  const image = path.join(root, 'avatar.png');
  await writeFile(image, 'image-fixture');
  const input = { sourceUrl: 'https://example.com/avatar.png', title: '蓝色大肥鱼头像', mime: 'image/png', localPath: image, width: 512, height: 512 };
  const first = await registerAsset(root, 'da-fei-yu', input);
  assert.equal(first.type, 'avatar');
  assert.equal(first.state, 'pending');
  const duplicate = await registerAsset(root, 'da-fei-yu', input);
  assert.equal(duplicate.duplicateOf, first.id);
  await setAssetState(root, 'da-fei-yu', first.id, 'approved');
  assert.equal((await listSendableAssets(root, 'da-fei-yu', 'avatar')).length, 1);
});

test('rejects unsupported or untrusted asset input', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-assets-'));
  await assert.rejects(() => registerAsset(root, 'da-fei-yu', { sourceUrl: 'file:///secret', title: 'x', mime: 'image/png' }), /sourceUrl/);
  await assert.rejects(() => registerAsset(root, 'da-fei-yu', { sourceUrl: 'https://example.com/x', title: 'x', mime: 'image/svg+xml' }), /unsupported/);
});
