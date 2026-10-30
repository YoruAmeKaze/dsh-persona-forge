import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { personaRoot } from './persona-runtime.mjs';

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function approveResearchFact(root, id, fact, { status = 'approved' } = {}) {
  if (!fact || typeof fact.id !== 'string' || typeof fact.claim !== 'string') throw new Error('fact requires id and claim');
  if (!Array.isArray(fact.sourceIds) || fact.sourceIds.length === 0) throw new Error('approved fact requires sourceIds');
  const dir = path.join(personaRoot(root, id), 'memory');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'index.json');
  const memory = await readJson(file, { entries: [], conflicts: [], lastReviewedAt: null });
  const entry = { id: `memory-${fact.id}`, content: fact.claim, sourceIds: fact.sourceIds, confidence: fact.confidence ?? 'unknown', status, approvedAt: new Date().toISOString() };
  const index = memory.entries.findIndex((item) => item.id === entry.id);
  if (index >= 0) memory.entries[index] = entry;
  else memory.entries.push(entry);
  memory.lastReviewedAt = entry.approvedAt;
  await writeFile(file, `${JSON.stringify(memory, null, 2)}\n`, 'utf8');
  return entry;
}
