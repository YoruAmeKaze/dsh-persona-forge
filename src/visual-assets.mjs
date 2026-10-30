import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { personaRoot } from './persona-runtime.mjs';

const TYPES = new Set(['avatar', 'photo', 'sticker', 'gif', 'screenshot', 'other']);
const STATES = new Set(['pending', 'approved', 'rejected']);
const EXTENSIONS = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/gif', '.gif']]);

async function loadIndex(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return { items: [] };
    throw error;
  }
}

async function saveIndex(file, index) {
  await writeFile(file, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

export function classifyAsset(mime, hint = '') {
  const value = `${mime ?? ''} ${hint}`.toLowerCase();
  if (value.includes('avatar') || value.includes('头像')) return 'avatar';
  if (value.includes('sticker') || value.includes('表情')) return 'sticker';
  if (value.includes('gif')) return 'gif';
  if (value.includes('photo') || value.includes('照片')) return 'photo';
  if (value.includes('screenshot') || value.includes('截图')) return 'screenshot';
  return 'other';
}

export async function registerAsset(root, id, { sourceUrl, title, mime, type, localPath, width, height, userConfirmed = false }) {
  if (typeof sourceUrl !== 'string' || !/^https?:\/\//i.test(sourceUrl)) throw new Error('sourceUrl must be http(s)');
  if (typeof title !== 'string' || !title.trim()) throw new Error('title is required');
  if (!EXTENSIONS.has(mime)) throw new Error(`unsupported image mime: ${mime}`);
  const assetType = type ?? classifyAsset(mime, title);
  if (!TYPES.has(assetType)) throw new Error(`unknown asset type: ${assetType}`);
  let size = null;
  let sha256 = null;
  if (localPath) {
    const info = await stat(localPath);
    size = info.size;
    sha256 = createHash('sha256').update(await readFile(localPath)).digest('hex');
  }
  const dir = path.join(personaRoot(root, id), 'assets');
  await mkdir(dir, { recursive: true });
  const indexFile = path.join(dir, 'index.json');
  const index = await loadIndex(indexFile);
  const duplicate = sha256 ? index.items.find((item) => item.sha256 === sha256) : index.items.find((item) => item.sourceUrl === sourceUrl);
  if (duplicate) return { ...duplicate, duplicateOf: duplicate.id };
  const item = {
    id: `asset-${index.items.length + 1}`,
    title: title.trim(), sourceUrl, mime, type: assetType, localPath: localPath ?? null,
    width: width ?? null, height: height ?? null, size, sha256,
    state: userConfirmed ? 'approved' : 'pending',
    addedAt: new Date().toISOString(),
  };
  index.items.push(item);
  await saveIndex(indexFile, index);
  return item;
}

export async function setAssetState(root, id, assetId, state) {
  if (!STATES.has(state)) throw new Error(`unknown asset state: ${state}`);
  const file = path.join(personaRoot(root, id), 'assets', 'index.json');
  const index = await loadIndex(file);
  const item = index.items.find((entry) => entry.id === assetId);
  if (!item) throw new Error(`unknown asset: ${assetId}`);
  item.state = state;
  item.updatedAt = new Date().toISOString();
  await saveIndex(file, index);
  return item;
}

export async function listSendableAssets(root, id, type) {
  const file = path.join(personaRoot(root, id), 'assets', 'index.json');
  const index = await loadIndex(file);
  return index.items.filter((item) => item.state === 'approved' && (!type || item.type === type) && item.localPath);
}
