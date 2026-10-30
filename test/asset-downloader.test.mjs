import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { downloadAsset } from '../src/asset-downloader.mjs';

test('downloads an approved image through an injected fetch implementation', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'persona-download-'));
  const response = { ok: true, headers: new Map([['content-type', 'image/png']]), arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  const item = await downloadAsset(root, 'da-fei-yu', { url: 'https://example.com/a.png', title: 'avatar', confirm: true, fetchImpl: async () => ({ ...response, headers: { get: (key) => response.headers.get(key) } }) });
  assert.equal(item.state, 'approved');
  assert.equal(item.mime, 'image/png');
});
