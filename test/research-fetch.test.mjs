import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResearchPage } from '../src/research-fetch.mjs';

test('normalizes a page into a provenance-bearing source', () => {
  const page = normalizeResearchPage('https://example.com/p', '<title>Whale</title><meta name="description" content="blue whale"> <p>Hello</p>');
  assert.equal(page.source.title, 'Whale');
  assert.equal(page.source.confidence, 'medium');
  assert.match(page.excerpt, /Hello/);
});
