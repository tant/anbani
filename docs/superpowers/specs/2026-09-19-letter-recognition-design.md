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
