import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPersona, personaRoot, validateManifest } from './persona-runtime.mjs';

const SNAPSHOT_FILES = [
  ['manifest.json', 'manifest.json'],
  ['identity/personality.md', 'identity/personality.md'],
  ['style/speech-rules.md', 'style/speech-rules.md'],
  ['memory/index.json', 'memory/index.json'],
];

async function json(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function save(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function listVersions(root, id) {
  const dir = personaRoot(root, id);
  const history = await json(path.join(dir, 'versions', 'index.json'), { items: [] });
  return history.items;
}

export async function createRevision(root, id, { personality, style, memory, note, author = 'local-user' }) {
  const persona = await loadPersona(root, id);
  const items = await listVersions(root, id);
  const version = persona.manifest.version + 1;
  const timestamp = new Date().toISOString();
  const dir = personaRoot(root, id);
  const snapshot = path.join(dir, 'versions', `v${version}`);
  await mkdir(snapshot, { recursive: true });
  const manifest = { ...persona.manifest, version, updatedAt: timestamp };
  validateManifest(manifest);
  const files = {
    personality: personality ?? persona.personality,
    style: style ?? persona.style,
    memory: memory ?? persona.memory,
  };
  await mkdir(path.join(snapshot, 'identity'), { recursive: true });
  await mkdir(path.join(snapshot, 'style'), { recursive: true });
  await mkdir(path.join(snapshot, 'memory'), { recursive: true });
  await save(path.join(snapshot, 'manifest.json'), manifest);
  await writeFile(path.join(snapshot, 'identity', 'personality.md'), files.personality, 'utf8');
  await writeFile(path.join(snapshot, 'style', 'speech-rules.md'), files.style, 'utf8');
  await save(path.join(snapshot, 'memory', 'index.json'), files.memory);
  for (const [from, to] of SNAPSHOT_FILES) {
    await mkdir(path.dirname(path.join(dir, to)), { recursive: true });
    await cp(path.join(snapshot, from), path.join(dir, to));
  }
  const entry = { version, createdAt: timestamp, author, note: note ?? '', snapshot: `versions/v${version}` };
  await save(path.join(dir, 'versions', 'index.json'), { items: [...items, entry] });
  return { ...entry, manifest };
}

export async function rollbackRevision(root, id, version, { author = 'local-user', note = '' } = {}) {
  const items = await listVersions(root, id);
  const target = items.find((item) => item.version === version);
  if (!target) throw new Error(`unknown persona version: ${version}`);
  const dir = personaRoot(root, id);
  const snapshot = path.join(dir, target.snapshot);
  for (const [, relative] of SNAPSHOT_FILES) {
    await mkdir(path.dirname(path.join(dir, relative)), { recursive: true });
    await cp(path.join(snapshot, relative), path.join(dir, relative));
  }
  const marker = { rolledBackAt: new Date().toISOString(), sourceVersion: version, author, note };
  await save(path.join(dir, 'versions', 'rollback.json'), marker);
  return { ...marker, manifest: JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')) };
}

export function compareRevisions(left, right) {
  return {
    personalityChanged: left.personality !== right.personality,
    styleChanged: left.style !== right.style,
    memoryChanged: JSON.stringify(left.memory) !== JSON.stringify(right.memory),
  };
}

export function evaluateScenario(response, scenario) {
  const text = String(response ?? '');
  const failures = [];
  for (const phrase of scenario.mustInclude ?? []) if (!text.includes(phrase)) failures.push(`missing: ${phrase}`);
  for (const phrase of scenario.mustAvoid ?? []) if (text.includes(phrase)) failures.push(`forbidden: ${phrase}`);
  return { id: scenario.id, passed: failures.length === 0, failures, checkedAt: new Date().toISOString() };
}

