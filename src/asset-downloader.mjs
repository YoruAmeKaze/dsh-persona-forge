import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { registerAsset } from './visual-assets.mjs';

const MIME_EXT = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/gif', '.gif']]);

export async function downloadAsset(root, id, { url, title, type, fetchImpl = globalThis.fetch, maxBytes = 10 * 1024 * 1024, confirm = false } = {}) {
  if (!/^https?:\/\//i.test(url)) throw new Error('asset URL must be http(s)');
  const response = await fetchImpl(url, { headers: { 'User-Agent': 'PersonaForge/1.0 asset downloader' } });
  if (!response.ok) throw new Error(`asset download failed: HTTP ${response.status}`);
  const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!MIME_EXT.has(mime)) throw new Error(`unsupported downloaded MIME: ${mime || 'unknown'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error(`asset exceeds maxBytes: ${bytes.length}`);
  const dir = path.join(root, 'personas', id, 'assets', 'files');
  await mkdir(dir, { recursive: true });
  const filename = `download-${Date.now()}${MIME_EXT.get(mime)}`;
  const localPath = path.join(dir, filename);
  await writeFile(localPath, bytes);
  return registerAsset(root, id, { sourceUrl: url, title, mime, type, localPath, userConfirmed: confirm });
}
