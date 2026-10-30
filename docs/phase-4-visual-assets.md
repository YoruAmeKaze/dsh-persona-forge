# Phase 4 Visual Assets

## Delivered

- `src/visual-assets.mjs` stores visual asset metadata under `assets/index.json`.
- Supported asset categories include avatar, photo, sticker, GIF, screenshot, and other.
- Every asset records source URL, MIME type, dimensions, byte size, SHA-256 when downloaded, and confirmation state.
- Duplicate local files are detected by SHA-256; remote-only records fall back to source URL matching.
- New assets start as `pending` unless the user explicitly confirms them.
- `listSendableAssets()` exposes only approved assets with local files for a later QQ media adapter.

## Safety boundary

The workflow does not download arbitrary URLs and does not send media directly. A future downloader must enforce content limits, MIME validation, source attribution, and user confirmation before calling `registerAsset()` with a local file. A future QQ adapter can use `listSendableAssets()` without bypassing the approval state.

## Verification

```text
npm test
8 tests passed
```

## Phase 5 entry criteria

Phase 5 can connect the persona runtime to DSH's `system-prompt/assemble`, add controlled switching and session policy, and wire approved media to the official QQ plugin's send methods.

