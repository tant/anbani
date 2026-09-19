# Mkhedruli letter recognition — design

## Goal

Help learners recognise the 33 modern Georgian (Mkhedruli) letters and their sounds, in both directions:
see ა → know it reads `a`; see `a` → pick ა.

## Decisions

| Area | Decision |
|---|---|
| License | Code MIT. No audio in this phase, so no media licensing yet. |
| Price | Free. Everything works without an account; an account only syncs progress. |
| Platforms | Mobile first, desktop supported. Installable PWA, works offline. |
| Frontend | SvelteKit 2 + Svelte 5, `adapter-static` SPA build, served by PocketBase `--publicDir`. |
| Backend | PocketBase 0.40: auth (email/password), user profile fields, review sync. |
| UI languages | Vietnamese and English. Chosen by the learner, stored in the profile (`users.lang`), or in `localStorage` for guests. |
| Content | The 33 letters live in the repo (`src/lib/letters.ts`), not in the database: versioned, reviewable by PR, available offline. |
| Sound shown as | Georgian national romanisation (2002), `'` marks ejectives, plus IPA and a hint in the learner's language. |
| Out of scope | Audio playback, pronunciation scoring, words, typing exercises, handwriting. |

## Exercises

Two skills per letter, each with its own spaced-repetition card:

- `read`: prompt is the glyph, options are sounds.
- `recall`: prompt is the sound, options are glyphs.

Each question has the correct answer plus **2–5 distractors** (3–6 choices). Default 3 distractors. The learner sets it in Settings; stored in `users.distractors` or `localStorage`.

Distractor priority, first tier first, no duplicates:

1. Letters this learner previously picked by mistake for this target.
2. Similar letters: same sound group for `read`; visually similar glyphs (`looksLike`) for `recall`.
3. Letters already introduced.
4. Any letter.

`looksLike` is the top 3 by blurred-pixel IoU of glyphs rendered in Noto Serif Georgian and Noto Sans Georgian, aligned on the baseline.

## Scheduling

- FSRS via `ts-fsrs` with short-term learning steps.
- Grade: wrong → Again; right within 5 s → Good; right slower → Hard.
- Next task: the most overdue card, avoiding the card just asked; otherwise introduce the next new letter (frequency order) while fewer than 4 letters are still in learning; otherwise a card due within 15 minutes; otherwise done.
- A session is 20 answers.
- A letter is "known" when both cards are in Review state with stability ≥ 7 days.

## Data (PocketBase)

- `users` (+ `lang` select vi/en, `distractors` number 2–5).
- `reviews`: `user` relation, `key` text (`read:ა`), `card` json (ts-fsrs Card), `due` date, `updated` autodate. Unique `(user, key)`. Rules: owner only.

Sync is local-first: `localStorage` is the source of truth on the device; changed keys are marked dirty and pushed when signed in and online. On sign-in the app pulls every review and keeps whichever card has the later `last_review` (then more `reps`).

## Extension points

- New content type (words, syllables): new item ids and new skill names; the `reviews` key format `skill:item` already fits.
- Audio: add an `audio` path to `Letter`, a `hear` skill, and credits for media licenses.
- Pronunciation scoring: separate service, called from a new skill; no change to scheduling.

## Visual design

The one bold element is the Georgian copybook four-line staff: every glyph sits on ascender, x-height, baseline and descender lines computed from Noto Serif Georgian metrics (0.772 / 0.548 / 0 / −0.252 em). The home alphabet grid is a copybook page; each learning screen shows one letter on a large staff. Everything else stays quiet.

- Colours: cool copybook paper `#EEF2F7`, indigo ink `#16233F`, lapis `#2A55C0` (learning, primary action), turquoise `#13806F` (correct), pomegranate `#B42A33` (wrong), rules `#C3CEE0` / `#8FA0BF`. Dark theme mirrors these.
- Type: Noto Serif Georgian for glyphs, Lexend for Latin UI text (built for reading proficiency, has a Vietnamese subset). Both self-hosted via Fontsource for offline use.

## Modes (added 2026-09-19)

The app has two separate modes, both reachable from the home page.

- **Learn** (`/learn`): the spaced-repetition flow above. Unchanged.
- **Test** (`/test`): a self-check that never touches the review schedule or the confusion history.
  - Setup: letters = all 33, studied letters (any card exists), or a custom pick on the alphabet grid; question type = glyph → sound, sound → glyph, or mixed (half each, shuffled). Choices per question come from the same Settings value (2–5 distractors). The last setup is remembered on the device.
  - Run: every chosen letter is asked exactly once in random order. Immediate right/wrong feedback, same question screen as Learn.
  - Result: score and percentage, the missed letters with the sound and what was picked, "Retest missed letters" (same letters, same question type), "New test".

## Navigation and motion (added 2026-09-19)

- App shell: a phone-width column (max 560px) on a backdrop; bottom tab bar with Alphabet, Learn (badge = cards due), Test, Settings; sticky title bars. The tab bar hides while a Learn session or a test is running (`ui.immersive`, or the `/learn` route).
- Touch: `touch-action: manipulation`, no text selection on controls, 0.97 press scale, no overscroll bounce.
- Motion answers the learner's action, except two deliberate moments: the copybook page filling in on the first home visit of a session, and a new letter being written (rules drawn, then the glyph inked).
  - Page change: View Transitions API cross-fade with a small rise; the tab bar keeps its own layer.
  - Question: slides in; right answer pops and turns the prompt green; wrong answer shakes; comparison slides down.
  - Letter sheet slides up and back down (Esc and backdrop tap included); test and session scores count up; missed letters appear one after another; active tab pill widens; the due badge pops when its count changes; a failed sign-in message shakes; the custom letter picker slides open.
  - Staggered entrances (`.rise`, `--d` × 80 ms): the welcome screen assembles under the letter being written; a new letter's sound and hint follow its writing; the end-of-session screen.
- `prefers-reduced-motion`: CSS animations off globally; Svelte transitions get zero duration through `dur()` in `src/lib/motion.ts`; view transitions off.

## Georgian letter style (added 2026-09-19, revised)

Learners pick the glyph style closest to their book (Settings and Welcome; stored in `localStorage` and `users.glyphFont`):

| Key | Font | License |
|---|---|---|
| `sans` (default) | Noto Sans Georgian (Fontsource) | OFL 1.1 |
| `serif` | BPG Serif Modern | Bitstream Vera Fonts |
| `pen` | BPG Mikhail Stephan | GPL-2 |
| `round` | BPG Glaho 2011 | GPL-2 |
| `system` | device font, staff rules hidden | n/a |

`scripts/build-fonts.py` downloads the BPG originals from Debian `fonts-bpg-georgian` 2012-5, subsets them to the 33 letters plus space, rewrites vertical metrics from the glyph bounds (the originals disagree, and Mikhail Stephan's descender has the wrong sign), writes `static/fonts/*.woff2`, and generates `src/fonts.generated.css`: an `@font-face` with `size-adjust` (x-height normalised to Noto Sans, ascenders capped at 0.86 em) and per-style staff variables (`--staff-lh`, `--staff-asc`, `--staff-x`, `--staff-base`, `--staff-desc`). `<html data-glyph>` selects the style.
