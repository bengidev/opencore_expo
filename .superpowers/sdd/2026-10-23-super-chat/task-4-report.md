# Task 4 simulator verification

Date: 2026-10-23
Simulator: iPhone 17, UDID `47850250-A022-4F79-A95B-4E1F84636B91`, iOS 27.0.
App served from the feature worktree via Metro on port 8082. The user's original Metro on port 8081 was left running.

## Verified

- Started on onboarding, tapped `Get started`, then verified Home loaded and showed suggestion buttons plus the shared Home composer.
- Focused Home composer and entered `Super chat seed check`; tapped `Send message`. `/chat` displayed the user message and `Pesan diterima. Penyedia model belum terhubung, jadi balasan ini masih lokal di perangkat.`
- In chat, opened `Open actions` and chose `New chat`. The conversation reset to the assistant greeting; the prior seeded message and reply disappeared.
- Returned Home, selected a suggestion card, and verified its text populated the composer. Submitting opened `/chat` with the selected suggestion as the user message and the local reply.
- From Home, opened composer actions and chose `New chat`. `/chat` opened with only the assistant greeting.
- In blank `/chat`, entered spaces and tapped `Send message`. Send was disabled and the greeting remained with no exchange.
- Entered `  axe trimmed check  ` and submitted. AXe / accessibility labels showed `axe trimmed check.` (iOS smart punctuation appended a period to typed input), plus the existing local assistant reply. Leading and trailing spaces did not appear in the message.
- Captured normal Home composer at `/tmp/super-chat-home-return.png`, sent standalone chat at `/tmp/super-chat-after-send.png`, reset chat at `/tmp/super-chat-reset.png`, and focused chat composer at `/tmp/super-chat-task4-focused.png`.

## Not verified

- The iOS software keyboard did not appear after focusing the composer. The caret appeared and AXe text entry worked, but the screenshot showed no keyboard. Therefore keyboard-driven viewport resizing/occlusion could not be checked. The composer remained docked above the bottom safe area in the resting layout; no simulator keyboard/hardware-keyboard settings were changed.
- An independent verifier agent aborted before performing its own interaction sequence; the cases above were exercised directly by the controller with AXe.

## Runtime notes

- On a few later taps, Expo's development/performance overlays opened while the app remained responsive. The app was returned to Home/blank chat through app navigation. No simulator reboot, erase, dependency or application-code changes were made for this verification.
- The worktree Metro on port 8082 remained available; the original project Metro on port 8081 was not changed.

## Final-review fix wave

Date: 2026-10-23

- Reformatted the existing expected message arrays and deep-equality assertions in `src/super-chat/chat-state.test.mjs`; no cases or behavior changed.
- Keyboard attempt on iPhone 17 UDID `47850250-A022-4F79-A95B-4E1F84636B91`, with the existing Metro on port 8082 (`/status` returned HTTP 200 and identified this worktree): inspected with `axe describe-ui`, tapped the composer by its visible screen coordinate (`axe tap -x 180 -y 730`), then captured `/tmp/super-chat-fixwave-keyboard.png` and re-inspected with AXe. The composer caret appeared, but no software keyboard was visible; the screenshot still showed the full-height composer and assistant greeting. An initial AXe label-targeted tap (`--label 'How can I help you today?'`) did not match and performed no tap. No simulator or machine settings were changed, and no build, restart, or reboot was performed. Keyboard-driven viewport resize/occlusion therefore remains unverified; no observed layout defect justified a layout change.
- Commands and results (run from the feature worktree):
  - `node --test src/super-chat/chat-state.test.mjs` — exit 0; 5 passed, 0 failed.
  - `npm test` — exit 0; 17 passed, 0 failed.
  - `npm run lint` — exit 0.
  - `npx tsc --noEmit` — exit 0; no diagnostics.
