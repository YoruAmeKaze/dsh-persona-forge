import { recordResearch } from './research-workflow.mjs';

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

function meta(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
  return html.match(pattern)?.[1]?.trim() ?? '';
}

export function normalizeResearchPage(url, html, collectedAt = new Date().toISOString()) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || meta(html, 'og:title') || url;
  const description = meta(html, 'description') || meta(html, 'og:description');
  return {
    source: { id: `web-${Buffer.from(url).toString('hex').slice(0, 24)}`, title, url, collectedAt, isPrimary: false, confidence: 'medium', notes: description },
    excerpt: stripHtml(html).slice(0, 12000),
  };
}

export async function fetchResearchPage(url, { fetchImpl = globalThis.fetch, timeoutMs = 20000 } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'PersonaForge/1.0 research fetcher' }, signal: controller.signal });
    if (!response.ok) throw new Error(`research fetch failed: HTTP ${response.status}`);
    return normalizeResearchPage(url, await response.text());
  } finally { clearTimeout(timer); }
}

export async function collectResearch(root, id, { category = 'contemporary', url, facts = [], fetchImpl, timeoutMs } = {}) {
  const page = await fetchResearchPage(url, { fetchImpl, timeoutMs });
  return { page, saved: await recordResearch(root, id, { category, source: page.source, facts }) };
}
