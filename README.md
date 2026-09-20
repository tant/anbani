# Anbani

Anbani (ანბანი, "alphabet" in Georgian) teaches you to read the 33 letters of the modern Georgian
alphabet, in both directions: see ა and know it reads `a`, hear of `a` and find ა.

Free and open source (MIT). It works offline, on phones and desktops, with the interface in
Vietnamese or English. An account is optional and only syncs progress between devices.

## What it does

**Learn** introduces letters one at a time and schedules reviews. Each letter carries two separate
cards, one per direction:

| Skill | Prompt | Options |
|---|---|---|
| `read` | the glyph | sounds |
| `recall` | the sound | glyphs |

A question shows the correct answer plus 2–5 distractors, set in Settings. Distractors are picked in
tiers, without duplicates: letters you previously confused with this one, then similar letters (same
sound group for `read`, visually similar shapes for `recall`), then letters you have already met,
then any letter.

Scheduling uses FSRS (`ts-fsrs`) with short-term learning steps. A wrong answer grades `Again`, a
right answer within 5 seconds `Good`, a slower one `Hard`. A session ends after 20 answers. A letter
counts as known when both of its cards reach the review state with stability of at least 7 days.

**Test** is a self-check that never touches the review schedule or the confusion history. Pick the
letters (all 33, the ones you have studied, or a custom set), pick the direction, and every chosen
letter is asked exactly once in random order. The result lists what you missed, with the correct
sound and what you picked.

Sounds are written in the Georgian national romanisation (2002), where `'` marks an ejective, and
each letter also carries its IPA and a hint in your language. There is no audio yet.

### Letter styles

Beginners often meet a shape in a book that does not match the shape on screen, so the glyph style is
a setting, offered on the welcome screen and in Settings:

| Style | Font | Look |
|---|---|---|
| Simple (default) | Noto Sans Georgian | even strokes, no serifs; close to Wikipedia and most phones |
| Book print | BPG Serif Modern | serifs, contrast between thick and thin |
| Pen | BPG Mikhail Stephan | soft strokes, close to handwriting |
| Bold rounded | BPG Glaho | heavy strokes with rounded ends |
| Device font | whatever the device ships | the staff rules are hidden, since metrics vary per device |

The first four are bundled, so they work offline. Every glyph sits on a four-line copybook staff, and
`scripts/build-fonts.py` normalises the fonts so no style looks larger than another: it subsets each
font to the 33 letters, rewrites the vertical metrics from the real glyph bounds (the originals
disagree with each other, and one has its descender sign inverted), and generates the `@font-face`
rules and per-style staff variables in `src/fonts.generated.css`.

## Stack

SvelteKit 2 and Svelte 5 runes, built by `adapter-static` as a single-page app, served by PocketBase
together with its own API. That is the whole deployment: one binary, one SQLite file, no separate web
server.

Progress is local-first. `localStorage` is the source of truth on the device; changed keys are marked
dirty and pushed when you are signed in and online. On sign-in the app pulls every review and keeps
whichever copy of a card was reviewed later. So the app is fully usable before you ever create an
account, and installable as a PWA.

The 33 letters live in `src/lib/letters.ts` rather than in the database: they are versioned,
reviewable in a pull request, and available offline.

## Run locally

Requires Node 24.

```sh
npm install
./scripts/get-pocketbase.sh   # downloads PocketBase into pb/ (checksum-verified)
npm run build && npm run pb   # app + API on http://127.0.0.1:8090
npm run dev                   # hot reload on :5173, proxies /api to :8090
npm test                      # unit tests
npm run check                 # svelte-check
```

To reach the PocketBase dashboard at `/_/`, copy `.env.example` to `.env`, set a superuser email and
password, then run `npm run pb:admin`.

## Deploy

The image builds the app and packages it with PocketBase:

```sh
docker build -t anbani .
docker run -d --name anbani -p 8090:8090 -v anbani-data:/app/pb_data anbani
```

Put it behind a reverse proxy that terminates TLS and forwards to port 8090. Database migrations in
`pb/pb_migrations` run automatically at startup. Keep `/app/pb_data` on a volume — it holds the
SQLite database.

Because the database is SQLite, never run two containers against the same volume. On an orchestrator,
stop the old container before starting the new one, which trades a few seconds of downtime for
never having two writers.

## Project layout

| Path | What lives there |
|---|---|
| `src/lib/letters.ts` | the letters, sounds, hints — content changes go here |
| `src/lib/session.ts`, `srs.ts`, `options.ts` | what to ask next, scheduling, distractor choice |
| `src/lib/quiz.ts` | test-mode question sets |
| `src/lib/progress.svelte.ts`, `storage.ts`, `pb.ts` | local state, persistence, sync |
| `src/lib/messages.ts`, `i18n.ts` | Vietnamese and English strings |
| `src/routes/` | the screens: alphabet, learn, test, settings, welcome |
| `pb/pb_migrations/` | database schema |
| `scripts/build-fonts.py` | rebuilds the bundled fonts and `src/fonts.generated.css` |
| `docs/user-flow.md` | the user flow, screen by screen (Vietnamese) |

## Licenses

Code is MIT, see `LICENSE`. The bundled fonts keep their own licenses, listed in
`static/fonts/LICENSE.md`: Noto Sans Georgian under the SIL Open Font License, BPG Serif Modern under
the Bitstream Vera license, and BPG Mikhail Stephan and BPG Glaho under GPL-2, which the build script
documents as required.
