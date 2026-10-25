# Task 1: Extract and test chat state helpers

## What I implemented
- Moved `ChatRole`, `ChatMessage`, and `createChatMessage` to `src/super-chat/chat-message.ts`.
- Added pure initial-message, exchange, and seed helpers plus composer draft normalization.
- Added five Node tests covering greeting, exchange roles/text, blank preservation, seed cases, and composer normalization.
- Expanded `npm test` to run onboarding and super-chat test files.

## What I tested
- `node --test src/super-chat/chat-state.test.mjs` — 5/5 passed.
- `npm test` — 17/17 passed.

## TDD Evidence
- RED: `node --test src/super-chat/chat-state.test.mjs` failed with `ERR_MODULE_NOT_FOUND` for `src/super-chat/chat-state.ts`, as expected before implementation.
- GREEN: Same focused test command passed all 5 tests after adding helpers.

## Files changed
- Added `src/super-chat/chat-state.test.mjs`, `src/super-chat/chat-state.ts`, `src/super-chat/composer-state.ts`.
- Moved `src/types/chat.ts` to `src/super-chat/chat-message.ts`.
- Modified `package.json` test script.

## Self-review findings
- The greeting and Indonesian local reply match the existing chat route verbatim. Blank exchange returns the original array unchanged; seed arrays only use their first entry.

## Issues or concerns
- Existing Node 26 `MODULE_TYPELESS_PACKAGE_JSON` warnings remain for onboarding TypeScript modules; the new `.ts` module produces the same warning. No dependencies or native projects were changed.
- Follow-up validation initially found imports of the moved type file plus a TypeScript extension import issue. Updated the three existing chat imports and used extensionless TS import; this is required for coherent move and TypeScript compilation.

## Fix Round 1

### Changed files
- `src/app/chat.tsx`: replaced route-local initialization, seed parsing, and exchange logic with `createInitialChatMessages`, `readChatSeed`, and `appendChatExchange`, retaining the one-time-seed guard.
- `tsconfig.json`: enabled `allowImportingTsExtensions` for the existing no-emit configuration.

### Verification
- `node --test src/super-chat/chat-state.test.mjs` — PASS, 5/5.
- `npx tsc --noEmit --pretty false` — PASS, exit 0.
- `npm run lint` — PASS, exit 0.
- `npm test` — PASS, 17/17.

Existing Node 26 `MODULE_TYPELESS_PACKAGE_JSON` warnings remain, including the helper `.ts` module.
