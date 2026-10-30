import { loadActivePersona, switchActivePersona } from './persona-runtime.mjs';
import { composePersonaPrompt } from './persona-runtime.mjs';

export function createPersonaPromptHandler(root) {
  return async (_assembly, context, next) => {
    const assembled = await next();
    if (!context?.agent) return assembled;
    const persona = await loadActivePersona(root);
    if (!persona) return assembled;
    const section = {
      name: 'persona-forge:active-persona',
      order: 80,
      text: composePersonaPrompt(persona),
    };
    return { ...assembled, sections: [...(assembled.sections ?? []), section] };
  };
}

export async function switchPersonaForRuntime(root, id, version) {
  const persona = await switchActivePersona(root, id, version);
  return {
    persona,
    sessionPolicy: 'new-session-required',
    reason: 'persona prompt is session-scoped; existing sessions must be rebuilt or reset',
  };
}

export function registerPersonaPrompt(ctx, root) {
  const handler = createPersonaPromptHandler(root);
  ctx.on('system-prompt/assemble', handler);
  return handler;
}
