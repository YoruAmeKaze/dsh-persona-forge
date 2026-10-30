import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PERSONA_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') throw new Error('manifest must be an object');
  if (!PERSONA_ID.test(manifest.id)) throw new Error('manifest.id must use lowercase letters, numbers, and hyphens');
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) throw new Error('manifest.name is required');
  if (!Number.isInteger(manifest.version) || manifest.version < 1) throw new Error('manifest.version must be a positive integer');
  if (typeof manifest.updatedAt !== 'string' || Number.isNaN(Date.parse(manifest.updatedAt))) throw new Error('manifest.updatedAt must be an ISO date');
  return manifest;
}

export function personaRoot(root, id) {
  if (!PERSONA_ID.test(id)) throw new Error('invalid persona id');
  return path.join(root, 'personas', id);
}

export async function loadPersona(root, id) {
  const dir = personaRoot(root, id);
  const manifest = validateManifest(JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')));
  const [personality, style, memory] = await Promise.all([
    readFile(path.join(dir, 'identity', 'personality.md'), 'utf8'),
    readFile(path.join(dir, 'style', 'speech-rules.md'), 'utf8'),
    readFile(path.join(dir, 'memory', 'index.json'), 'utf8').then(JSON.parse),
  ]);
  return { dir, manifest, personality, style, memory };
}

export function composePersonaPrompt(persona) {
  const sections = [
    `# Persona: ${persona.manifest.name}`,
    `Persona id: ${persona.manifest.id}`,
    '## Personality', persona.personality.trim(),
    '## Speech rules', persona.style.trim(),
    '## Memory index', JSON.stringify(persona.memory, null, 2),
    '## Runtime rules',
    'Stay consistent with this persona. Treat the memory index as reference material, not as a license to invent unsupported facts.',
  ];
  return sections.join('\n\n');
}

export async function readActivePersona(root) {
  try {
    return JSON.parse(await readFile(path.join(root, 'active-persona.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function switchActivePersona(root, id, version) {
  const persona = await loadPersona(root, id);
  if (version !== undefined && persona.manifest.version !== version) {
    throw new Error(`persona version mismatch: requested ${version}, found ${persona.manifest.version}`);
  }
  await mkdir(root, { recursive: true });
  const target = path.join(root, 'active-persona.json');
  const temp = `${target}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify({ id, version: persona.manifest.version, switchedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  await rename(temp, target);
  return persona;
}

export async function loadActivePersona(root) {
  const active = await readActivePersona(root);
  if (!active) return null;
  const persona = await loadPersona(root, active.id);
  if (persona.manifest.version !== active.version) {
    throw new Error(`active persona state is stale: ${active.id} points to v${active.version}, package is v${persona.manifest.version}`);
  }
  return persona;
}
