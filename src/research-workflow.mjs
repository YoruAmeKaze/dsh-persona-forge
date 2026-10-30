import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { personaRoot } from './persona-runtime.mjs';

export const SOURCE_CATEGORIES = Object.freeze({
  historical: ['archive', 'library', 'academic', 'official'],
  contemporary: ['official-site', 'official-social', 'interview', 'news'],
  fictional: ['original-work', 'official-setting', 'licensed-reference'],
  personal: ['user-provided', 'private-record'],
});

const CONFIDENCE = new Set(['high', 'medium', 'low', 'unknown']);

function iso(value, field) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error(`${field} must be an ISO date`);
  return value;
}

export function classifySubject(input) {
  const name = String(input ?? '').trim();
  if (!name) throw new Error('subject name is required');
  const lower = name.toLowerCase();
  if (/(小说|角色|人物|游戏|动漫|电影|剧中|fiction|character)/i.test(name)) return { category: 'fictional', confidence: 'medium' };
  if (/(公司|品牌|官方账号|ceo|创始人)/i.test(name)) return { category: 'contemporary', confidence: 'low' };
  return { category: 'historical', confidence: 'low' };
}

export function validateSource(source) {
  if (!source || typeof source !== 'object') throw new Error('source must be an object');
  if (typeof source.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(source.id)) throw new Error('source.id is invalid');
  if (typeof source.title !== 'string' || !source.title.trim()) throw new Error('source.title is required');
  if (typeof source.url !== 'string' || !/^https?:\/\//i.test(source.url)) throw new Error('source.url must be http(s)');
  if (!CONFIDENCE.has(source.confidence)) throw new Error('source.confidence is invalid');
  iso(source.collectedAt, 'source.collectedAt');
  if (typeof source.isPrimary !== 'boolean') throw new Error('source.isPrimary must be boolean');
  return source;
}

export function validateFact(fact) {
  if (!fact || typeof fact !== 'object') throw new Error('fact must be an object');
  if (typeof fact.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(fact.id)) throw new Error('fact.id is invalid');
  if (typeof fact.claim !== 'string' || !fact.claim.trim()) throw new Error('fact.claim is required');
  if (!Array.isArray(fact.sourceIds) || fact.sourceIds.length === 0) throw new Error('fact.sourceIds is required');
  if (!CONFIDENCE.has(fact.confidence)) throw new Error('fact.confidence is invalid');
  iso(fact.recordedAt, 'fact.recordedAt');
  return fact;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function saveJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function ensureResearchPackage(root, id, category = 'historical') {
  if (!SOURCE_CATEGORIES[category]) throw new Error(`unknown category: ${category}`);
  const dir = path.join(personaRoot(root, id), 'research');
  await mkdir(dir, { recursive: true });
  const sourcesFile = path.join(dir, 'sources.json');
  const factsFile = path.join(dir, 'facts.json');
  const conflictsFile = path.join(dir, 'conflicts.json');
  const sources = await readJson(sourcesFile, { category, templates: SOURCE_CATEGORIES[category], items: [] });
  const facts = await readJson(factsFile, { items: [] });
  const conflicts = await readJson(conflictsFile, { items: [] });
  await saveJson(sourcesFile, sources);
  await saveJson(factsFile, facts);
  await saveJson(conflictsFile, conflicts);
  return { dir, sourcesFile, factsFile, conflictsFile };
}

export async function recordResearch(root, id, { category = 'historical', source, facts = [], conflicts = [] }) {
  const files = await ensureResearchPackage(root, id, category);
  validateSource(source);
  for (const fact of facts) validateFact(fact);
  const sources = await readJson(files.sourcesFile, { category, templates: SOURCE_CATEGORIES[category], items: [] });
  const existingSource = sources.items.find((item) => item.id === source.id);
  if (existingSource) Object.assign(existingSource, source);
  else sources.items.push(source);
  const factFile = await readJson(files.factsFile, { items: [] });
  for (const fact of facts) {
    if (!fact.sourceIds.every((sourceId) => sources.items.some((item) => item.id === sourceId))) throw new Error(`fact ${fact.id} references an unknown source`);
    const existing = factFile.items.find((item) => item.id === fact.id);
    if (existing) Object.assign(existing, fact);
    else factFile.items.push(fact);
  }
  const conflictFile = await readJson(files.conflictsFile, { items: [] });
  for (const conflict of conflicts) {
    if (typeof conflict.id !== 'string' || typeof conflict.topic !== 'string' || !Array.isArray(conflict.claims)) throw new Error('conflict requires id, topic, and claims');
    conflict.status ??= 'open';
    conflictFile.items.push(conflict);
  }
  await saveJson(files.sourcesFile, sources);
  await saveJson(files.factsFile, factFile);
  await saveJson(files.conflictsFile, conflictFile);
  return { sourceCount: sources.items.length, factCount: factFile.items.length, conflictCount: conflictFile.items.length };
}
