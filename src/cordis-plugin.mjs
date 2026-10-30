import { createPersonaPromptHandler } from './dsh-persona-adapter.mjs';
import { collectResearch } from './research-fetch.mjs';
import { downloadAsset } from './asset-downloader.mjs';
import { loadActivePersona, switchActivePersona } from './persona-runtime.mjs';
import { exportToQqBridge } from './qq-bridge-compat.mjs';
import { approveResearchFact } from './memory-workflow.mjs';

export function createPersonaForgeService(root) {
  return {
    loadActive: () => loadActivePersona(root),
    switch: (id, version) => switchActivePersona(root, id, version),
    collectResearch: (id, options) => collectResearch(root, id, options),
    downloadAsset: (id, options) => downloadAsset(root, id, options),
    exportToQqBridge: (id, bridgeRoot, options) => exportToQqBridge(root, id, bridgeRoot, options),
    approveResearchFact: (id, fact, options) => approveResearchFact(root, id, fact, options),
  };
}

/** Cordis plugin factory. DSH owns the host lifecycle and session reset policy. */
export function personaForgePlugin(ctx, config = {}) {
  const root = config.root ?? process.cwd();
  const service = createPersonaForgeService(root);
  ctx.provide?.('personaForge', service);
  ctx.on('system-prompt/assemble', createPersonaPromptHandler(root));
  return service;
}

export default personaForgePlugin;
