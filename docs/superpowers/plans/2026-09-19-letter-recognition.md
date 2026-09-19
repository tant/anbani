# Mkhedruli Letter Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first PWA that teaches the 33 Mkhedruli letters in both directions (glyph → sound, sound → glyph) with spaced repetition, 2–5 distractors, Vietnamese/English UI, and optional PocketBase sync.

**Architecture:** SvelteKit SPA (adapter-static, `ssr = false`) served by PocketBase through `--publicDir build`. Learning logic is pure TypeScript in `src/lib` (letters, srs, options, session) with unit tests; Svelte 5 rune modules (`*.svelte.ts`) hold local-first state in `localStorage` and push dirty review cards to PocketBase when signed in.

**Tech Stack:** Node 24 LTS, SvelteKit 2 / Svelte 5 / Vite, Vitest, ts-fsrs 5, PocketBase 0.40 (JS migrations) + `pocketbase` JS SDK, Fontsource (Noto Serif Georgian, Lexend).

**Spec:** `docs/superpowers/specs/2026-09-19-letter-recognition-design.md`

## Global Constraints

- Node 24.x: prefix shell commands with `export PATH=~/.nvm/versions/node/v24.17.0/bin:$PATH` (the default `node` on this machine is 22.x).
- License MIT. No mention of AI tooling anywhere in code, docs or commit messages.
- Distractors per question: min 2, max 5, default 3.
- UI languages: `vi`, `en` only. Every string goes through `t()`.
- Everything works without an account.
- Mobile first; content column max 560px; 16px side gutter; touch targets ≥ 48px.
- Colours only via the CSS custom properties defined in `src/app.css`.

## File map

```
package.json, svelte.config.js, vite.config.ts, tsconfig.json, .nvmrc, .gitignore, LICENSE, README.md
scripts/get-pocketbase.sh          download the PocketBase binary into pb/
pb/pb_migrations/1758240000_init.js users.lang, users.distractors, reviews collection
src/app.html, src/app.css          shell, design tokens
src/service-worker.ts              offline cache
static/manifest.webmanifest, static/icon-192.png, static/icon-512.png
src/lib/letters.ts (+test)         the 33 letters: sound, IPA, groups, look-alikes, hints
src/lib/srs.ts (+test)             card keys, grading, FSRS wrapper, letter status, merge rule
src/lib/options.ts (+test)         distractor selection
src/lib/session.ts (+test)         what to show next
src/lib/messages.ts, i18n.ts (+test) UI strings and formatting
src/lib/storage.ts, pb.ts          localStorage helpers, PocketBase client
src/lib/settings.svelte.ts         language + distractor setting, profile sync, t()
src/lib/progress.svelte.ts         cards, confusions, push/pull sync
src/lib/components/Staff.svelte    glyph on the four-line copybook staff
src/lib/components/LetterSheet.svelte letter detail dialog
src/lib/components/Icon.svelte     three inline icons
src/routes/+layout.ts, +layout.svelte, +page.svelte, learn/+page.svelte, settings/+page.svelte
```

---

### Task 1: Project scaffold

**Files:** Create `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.nvmrc`, `.gitignore`, `LICENSE`, `README.md`, `scripts/get-pocketbase.sh`, `src/app.html`, `src/routes/+layout.ts`, `src/routes/+page.svelte` (placeholder).

**Interfaces:** Produces `npm test`, `npm run check`, `npm run build` (output `build/`), `npm run pb` (PocketBase on :8090 serving `build/`), Vite dev proxy `/api` → `http://127.0.0.1:8090`.

- [ ] **Step 1: Write config files**

`package.json`
```json
{
	"name": "learn-mkhedruli",
	"private": true,
	"version": "0.1.0",
	"type": "module",
	"license": "MIT",
	"engines": { "node": ">=24" },
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"test": "vitest run",
		"pb": "./pb/pocketbase serve --dir pb/pb_data --migrationsDir pb/pb_migrations --publicDir build"
	}
}
```

`svelte.config.js`
```js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: { adapter: adapter({ fallback: 'index.html' }) }
};
```

`vite.config.ts`
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: { proxy: { '/api': 'http://127.0.0.1:8090' } },
	test: { include: ['src/**/*.test.ts'] }
});
```

`tsconfig.json`
```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"strict": true,
		"moduleResolution": "bundler",
		"skipLibCheck": true,
		"sourceMap": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"allowJs": true,
		"checkJs": true
	}
}
```

`.nvmrc` → `24`

`.gitignore`
```
node_modules/
build/
.svelte-kit/
pb/pocketbase
pb/pb_data/
.DS_Store
```

`scripts/get-pocketbase.sh`
```sh
#!/bin/sh
# Downloads the PocketBase binary for this machine into pb/.
set -eu
VERSION=0.40.4
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$(uname -m)" in
	x86_64) ARCH=amd64 ;;
	aarch64 | arm64) ARCH=arm64 ;;
	*) echo "unsupported arch: $(uname -m)" >&2; exit 1 ;;
esac
TMP=$(mktemp -d)
curl -fsSL -o "$TMP/pb.zip" "https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${OS}_${ARCH}.zip"
mkdir -p pb
unzip -o -q "$TMP/pb.zip" pocketbase -d pb
rm -rf "$TMP"
echo "pb/pocketbase $VERSION ready"
```

`src/app.html`
```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
		<meta name="theme-color" content="#eef2f7" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#0e1629" media="(prefers-color-scheme: dark)" />
		<meta name="description" content="Learn to read the 33 letters of the Georgian alphabet." />
		<link rel="icon" href="%sveltekit.assets%/icon-192.png" type="image/png" />
		<link rel="apple-touch-icon" href="%sveltekit.assets%/icon-192.png" />
		<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
		<title>Mkhedruli</title>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

`src/routes/+layout.ts`
```ts
export const ssr = false;
```

`src/routes/+page.svelte` (placeholder, replaced in Task 9)
```svelte
<h1>Mkhedruli</h1>
```

`LICENSE`: standard MIT text, `Copyright (c) 2026 learn-mkhedruli contributors`.

`README.md`
````markdown
# Mkhedruli

Learn to read the 33 letters of the modern Georgian alphabet: see ა and know it reads `a`, see `a` and find ა.

Free and open source (MIT). Works offline, on phones and desktops, in Vietnamese or English.

## Run locally

Requires Node 24.

```sh
npm install
./scripts/get-pocketbase.sh   # downloads PocketBase into pb/
npm run build && npm run pb   # app + API on http://127.0.0.1:8090
npm run dev                   # hot reload on :5173, proxies /api to :8090
npm test
```

An account is optional; it only syncs progress between devices.

## Project layout

- `src/lib/letters.ts`: the letters, sounds, hints. Content changes go here.
- `src/lib/session.ts`, `srs.ts`, `options.ts`: what to ask next, scheduling, distractors.
- `pb/pb_migrations`: database schema.
````

- [ ] **Step 2: Install dependencies**

```bash
export PATH=~/.nvm/versions/node/v24.17.0/bin:$PATH
npm i -D @sveltejs/kit @sveltejs/adapter-static @sveltejs/vite-plugin-svelte svelte svelte-check typescript vite vitest
npm i ts-fsrs pocketbase @fontsource-variable/noto-serif-georgian @fontsource-variable/lexend
chmod +x scripts/get-pocketbase.sh && ./scripts/get-pocketbase.sh
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build`
Expected: 0 errors, `build/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold SvelteKit SPA served by PocketBase"
```

---

### Task 2: Letter data

**Files:** Create `src/lib/letters.ts`, `src/lib/letters.test.ts`.

**Interfaces:** Produces `type Lang = 'vi' | 'en'`, `type SoundGroup`, `interface Letter { char; translit; ipa; group; looksLike: string[]; hint: Record<Lang,string> }`, `LETTERS: Letter[]` (teaching order), `ALPHABET: Letter[]` (alphabet order), `byChar: Map<string, Letter>`.

- [ ] **Step 1: Write the failing test** — `src/lib/letters.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { ALPHABET, LETTERS, byChar } from './letters';

describe('letters', () => {
	it('has the 33 modern letters once each, in alphabet order', () => {
		expect(LETTERS).toHaveLength(33);
		expect(ALPHABET.map((l) => l.char).join('')).toBe('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ');
	});

	it('gives every letter a distinct sound', () => {
		expect(new Set(LETTERS.map((l) => l.translit)).size).toBe(33);
	});

	it('lists three existing look-alikes other than the letter itself', () => {
		for (const l of LETTERS) {
			expect(l.looksLike).toHaveLength(3);
			for (const c of l.looksLike) {
				expect(byChar.has(c)).toBe(true);
				expect(c).not.toBe(l.char);
			}
		}
	});

	it('puts every letter in a sound group with at least four other letters', () => {
		for (const l of LETTERS) {
			expect(LETTERS.filter((o) => o.group === l.group).length).toBeGreaterThanOrEqual(5);
		}
	});

	it('has a hint in both languages', () => {
		for (const l of LETTERS) {
			expect(l.hint.vi.length).toBeGreaterThan(5);
			expect(l.hint.en.length).toBeGreaterThan(5);
		}
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/letters.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/lib/letters.ts`

```ts
export type Lang = 'vi' | 'en';

/** Letters whose sounds learners mix up; used for glyph → sound distractors. */
export type SoundGroup = 'vowel' | 'labial' | 'dental' | 'velar' | 'sibilant' | 'palatal';

export interface Letter {
	char: string;
	/** Georgian national romanisation (2002); ' marks an ejective. */
	translit: string;
	ipa: string;
	group: SoundGroup;
	/** Three most similar glyphs: blurred-pixel IoU in Noto Serif + Sans Georgian, baseline aligned. */
	looksLike: string[];
	hint: Record<Lang, string>;
}

const EJECTIVE_VI = 'khép cổ họng rồi bật âm thật gọn, không có luồng hơi';
const EJECTIVE_EN = 'close your throat, then release it sharply with no puff of air';

/** Teaching order: roughly by how often the letter appears in Georgian text. */
export const LETTERS: Letter[] = [
	{ char: 'ა', translit: 'a', ipa: 'ɑ', group: 'vowel', looksLike: ['პ', 'ჰ', 'ი'], hint: { vi: 'Như a trong “ba”.', en: 'Like a in “father”.' } },
	{ char: 'ი', translit: 'i', ipa: 'i', group: 'vowel', looksLike: ['ბ', 'ძ', 'ხ'], hint: { vi: 'Như i trong “đi”.', en: 'Like ee in “see”.' } },
	{ char: 'ე', translit: 'e', ipa: 'ɛ', group: 'vowel', looksLike: ['ვ', 'ქ', 'უ'], hint: { vi: 'Như e trong “xe”.', en: 'Like e in “bed”.' } },
	{ char: 'ს', translit: 's', ipa: 's', group: 'sibilant', looksLike: ['ხ', 'ნ', 'ზ'], hint: { vi: 'Như x trong “xa”, s không uốn lưỡi.', en: 'Like s in “sun”.' } },
	{ char: 'რ', translit: 'r', ipa: 'r', group: 'dental', looksLike: ['ო', 'ღ', 'თ'], hint: { vi: 'R rung nhẹ đầu lưỡi, như r trong tiếng Tây Ban Nha.', en: 'A tapped r, as in Spanish “pero”.' } },
	{ char: 'მ', translit: 'm', ipa: 'm', group: 'labial', looksLike: ['შ', 'ძ', 'ნ'], hint: { vi: 'Như m trong “mẹ”.', en: 'Like m in “mother”.' } },
	{ char: 'ბ', translit: 'b', ipa: 'b', group: 'labial', looksLike: ['ზ', 'ი', 'მ'], hint: { vi: 'Như b trong “bà”.', en: 'Like b in “bed”.' } },
	{ char: 'დ', translit: 'd', ipa: 'd', group: 'dental', looksLike: ['ღ', 'თ', 'ფ'], hint: { vi: 'Như đ trong “đi”.', en: 'Like d in “dog”.' } },
	{ char: 'ო', translit: 'o', ipa: 'ɔ', group: 'vowel', looksLike: ['ღ', 'რ', 'თ'], hint: { vi: 'Như o trong “no”.', en: 'Like o in “more”, but short.' } },
	{ char: 'ლ', translit: 'l', ipa: 'l', group: 'dental', looksLike: ['დ', 'ღ', 'ე'], hint: { vi: 'Như l trong “là”.', en: 'Like l in “lamp”.' } },
	{ char: 'ვ', translit: 'v', ipa: 'v', group: 'labial', looksLike: ['ე', 'კ', 'გ'], hint: { vi: 'Như v trong “về”.', en: 'Like v in “van”.' } },
	{ char: 'ნ', translit: 'n', ipa: 'n', group: 'dental', looksLike: ['ხ', 'ზ', 'წ'], hint: { vi: 'Như n trong “nó”.', en: 'Like n in “no”.' } },
	{ char: 'ტ', translit: "t'", ipa: 'tʼ', group: 'dental', looksLike: ['ც', 'ღ', 'ჭ'], hint: { vi: `T tống hơi: ${EJECTIVE_VI}. Gần t trong “ta” nhưng dứt hơn.`, en: `Ejective t: ${EJECTIVE_EN}.` } },
	{ char: 'გ', translit: 'g', ipa: 'ɡ', group: 'velar', looksLike: ['ვ', 'ე', 'ჟ'], hint: { vi: 'G tắc như g trong tiếng Anh “go”, không xát như g tiếng Việt.', en: 'Like g in “go”.' } },
	{ char: 'უ', translit: 'u', ipa: 'u', group: 'vowel', looksLike: ['ე', 'ჟ', 'ვ'], hint: { vi: 'Như u trong “thu”.', en: 'Like oo in “food”.' } },
	{ char: 'ქ', translit: 'k', ipa: 'kʰ', group: 'velar', looksLike: ['ე', 'ვ', 'უ'], hint: { vi: 'K bật hơi, như k trong tiếng Anh “kite”. Không phải kh tiếng Việt.', en: 'Like k in “kite”, with a puff of air.' } },
	{ char: 'კ', translit: "k'", ipa: 'kʼ', group: 'velar', looksLike: ['ვ', 'ე', 'ჟ'], hint: { vi: `K tống hơi: ${EJECTIVE_VI}. Gần c trong “ca” nhưng dứt hơn.`, en: `Ejective k: ${EJECTIVE_EN}.` } },
	{ char: 'თ', translit: 't', ipa: 'tʰ', group: 'dental', looksLike: ['დ', 'ო', 'ფ'], hint: { vi: 'T bật hơi, như th trong “tha”.', en: 'Like t in “top”, with a puff of air.' } },
	{ char: 'შ', translit: 'sh', ipa: 'ʃ', group: 'palatal', looksLike: ['მ', 'ძ', 'ბ'], hint: { vi: 'Như sh trong tiếng Anh “she”, gần s uốn lưỡi.', en: 'Like sh in “she”.' } },
	{ char: 'ც', translit: 'ts', ipa: 'tsʰ', group: 'sibilant', looksLike: ['ვ', 'ყ', 'ე'], hint: { vi: 'Như ts trong tiếng Anh “cats”, có luồng hơi.', en: 'Like ts in “cats”, with a puff of air.' } },
	{ char: 'ხ', translit: 'kh', ipa: 'x', group: 'velar', looksLike: ['ნ', 'ს', 'ზ'], hint: { vi: 'Như kh trong “khá”.', en: 'Like ch in Scottish “loch”.' } },
	{ char: 'წ', translit: "ts'", ipa: 'tsʼ', group: 'sibilant', looksLike: ['ნ', 'ზ', 'შ'], hint: { vi: `Ts tống hơi: ${EJECTIVE_VI}.`, en: `Ejective ts: ${EJECTIVE_EN}.` } },
	{ char: 'ყ', translit: "q'", ipa: 'qʼ', group: 'velar', looksLike: ['ჟ', 'ე', 'ვ'], hint: { vi: `Q tống hơi, đặt sâu trong cổ họng hơn k: ${EJECTIVE_VI}.`, en: `Ejective q, further back than k: ${EJECTIVE_EN}.` } },
	{ char: 'ზ', translit: 'z', ipa: 'z', group: 'sibilant', looksLike: ['ხ', 'ნ', 'ბ'], hint: { vi: 'Như z trong tiếng Anh “zoo”, gần d trong “da” giọng Bắc.', en: 'Like z in “zoo”.' } },
	{ char: 'ფ', translit: 'p', ipa: 'pʰ', group: 'labial', looksLike: ['თ', 'დ', 'ღ'], hint: { vi: 'P bật hơi, như p trong tiếng Anh “pen”. Không phải ph tiếng Việt.', en: 'Like p in “pen”, with a puff of air.' } },
	{ char: 'ჩ', translit: 'ch', ipa: 'tʃʰ', group: 'palatal', looksLike: ['ნ', 'წ', 'ხ'], hint: { vi: 'Như ch trong tiếng Anh “church”, có luồng hơi; khác ch tiếng Việt.', en: 'Like ch in “church”, with a puff of air.' } },
	{ char: 'ძ', translit: 'dz', ipa: 'dz', group: 'sibilant', looksLike: ['მ', 'შ', 'ბ'], hint: { vi: 'Như ds trong tiếng Anh “kids”.', en: 'Like ds in “kids”.' } },
	{ char: 'ღ', translit: 'gh', ipa: 'ɣ', group: 'velar', looksLike: ['ო', 'დ', 'რ'], hint: { vi: 'Như g trong “ga” của tiếng Việt, âm xát.', en: 'A throaty g, close to the French r in “Paris”.' } },
	{ char: 'ჯ', translit: 'j', ipa: 'dʒ', group: 'palatal', looksLike: ['ვ', 'გ', 'უ'], hint: { vi: 'Như j trong tiếng Anh “jam”.', en: 'Like j in “jam”.' } },
	{ char: 'პ', translit: "p'", ipa: 'pʼ', group: 'labial', looksLike: ['ჰ', 'ა', 'მ'], hint: { vi: `P tống hơi: ${EJECTIVE_VI}.`, en: `Ejective p: ${EJECTIVE_EN}.` } },
	{ char: 'ჭ', translit: "ch'", ipa: 'tʃʼ', group: 'palatal', looksLike: ['ვ', 'გ', 'ე'], hint: { vi: `Ch tống hơi (như “church”): ${EJECTIVE_VI}.`, en: `Ejective ch: ${EJECTIVE_EN}.` } },
	{ char: 'ჟ', translit: 'zh', ipa: 'ʒ', group: 'palatal', looksLike: ['ე', 'უ', 'ყ'], hint: { vi: 'Như s trong tiếng Anh “measure”.', en: 'Like s in “measure”.' } },
	{ char: 'ჰ', translit: 'h', ipa: 'h', group: 'velar', looksLike: ['პ', 'ა', 'მ'], hint: { vi: 'Như h trong “hà”.', en: 'Like h in “hat”.' } }
];

export const ALPHABET = [...LETTERS].sort((a, b) => a.char.codePointAt(0)! - b.char.codePointAt(0)!);

export const byChar = new Map(LETTERS.map((l) => [l.char, l]));
```

- [ ] **Step 4: Run tests** → `npx vitest run src/lib/letters.test.ts` PASS.

- [ ] **Step 5: Commit** — `git add src/lib/letters* && git commit -m "feat: add the 33 Mkhedruli letters with sounds and look-alikes"`

---

### Task 3: Spaced-repetition helpers

**Files:** Create `src/lib/srs.ts`, `src/lib/srs.test.ts`.

**Interfaces:**
- Produces `type Skill = 'read' | 'recall'`, `SKILLS`, `type Cards = Record<string, Card>`, `cardKey(skill, item): string`, `parseKey(key): { skill, item }`, `gradeAnswer(correct, ms): Grade`, `newCard(now): Card`, `reviewCard(card, grade, now): Card`, `reviveCard(raw): Card`, `isNewer(a, b): boolean`, `type LetterStatus`, `letterStatus(cards, char)`, `dueCount(cards, now)`, `SLOW_MS = 5000`, `KNOWN_STABILITY_DAYS = 7`.

- [ ] **Step 1: Write the failing test** — `src/lib/srs.test.ts`

```ts
import { Rating, State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { cardKey, dueCount, gradeAnswer, isNewer, letterStatus, newCard, parseKey, reviewCard, reviveCard } from './srs';

const now = new Date('2026-01-01T00:00:00Z');

describe('srs', () => {
	it('grades by correctness and speed', () => {
		expect(gradeAnswer(false, 100)).toBe(Rating.Again);
		expect(gradeAnswer(true, 1000)).toBe(Rating.Good);
		expect(gradeAnswer(true, 6000)).toBe(Rating.Hard);
	});

	it('round-trips keys', () => {
		expect(parseKey(cardKey('recall', 'ა'))).toEqual({ skill: 'recall', item: 'ა' });
	});

	it('reports letter status', () => {
		expect(letterStatus({}, 'ა')).toBe('unseen');
		expect(letterStatus({ 'read:ა': newCard(now) }, 'ა')).toBe('learning');
		const solid = { ...newCard(now), state: State.Review, stability: 10 };
		expect(letterStatus({ 'read:ა': solid, 'recall:ა': solid }, 'ა')).toBe('known');
		expect(letterStatus({ 'read:ა': solid, 'recall:ა': { ...solid, stability: 2 } }, 'ა')).toBe('learning');
	});

	it('prefers the card reviewed later, then the one with more reps', () => {
		const a = { ...newCard(now), last_review: new Date('2026-01-02'), reps: 1 };
		const b = { ...newCard(now), last_review: new Date('2026-01-01'), reps: 5 };
		expect(isNewer(a, b)).toBe(true);
		expect(isNewer(b, a)).toBe(false);
		expect(isNewer({ ...b, reps: 6 }, b)).toBe(true);
	});

	it('revives dates from JSON', () => {
		const card = reviveCard(JSON.parse(JSON.stringify(reviewCard(newCard(now), Rating.Good, now))));
		expect(card.due).toBeInstanceOf(Date);
		expect(card.last_review).toBeInstanceOf(Date);
	});

	it('brings a missed card back within minutes and counts due cards', () => {
		const missed = reviewCard(newCard(now), Rating.Again, now);
		expect(+missed.due - +now).toBeLessThanOrEqual(10 * 60_000);
		expect(dueCount({ a: newCard(now), b: missed }, now)).toBe(1);
	});
});
```

- [ ] **Step 2: Run** → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/lib/srs.ts`

```ts
import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';

/** read: glyph → sound. recall: sound → glyph. */
export type Skill = 'read' | 'recall';
export const SKILLS: Skill[] = ['read', 'recall'];

export type Cards = Record<string, Card>;
export type LetterStatus = 'unseen' | 'learning' | 'known';

export const SLOW_MS = 5000;
export const KNOWN_STABILITY_DAYS = 7;

const scheduler = fsrs();

export const cardKey = (skill: Skill, item: string) => `${skill}:${item}`;

export function parseKey(key: string): { skill: Skill; item: string } {
	const i = key.indexOf(':');
	return { skill: key.slice(0, i) as Skill, item: key.slice(i + 1) };
}

export function gradeAnswer(correct: boolean, ms: number): Grade {
	if (!correct) return Rating.Again;
	return ms > SLOW_MS ? Rating.Hard : Rating.Good;
}

export const newCard = (now: Date): Card => createEmptyCard(now);

export const reviewCard = (card: Card, grade: Grade, now: Date): Card => scheduler.next(card, now, grade).card;

/** Cards read back from JSON carry ISO strings where ts-fsrs expects Dates. */
export function reviveCard(raw: Card): Card {
	return { ...raw, due: new Date(raw.due), last_review: raw.last_review ? new Date(raw.last_review) : undefined };
}

/** True when `a` reflects more practice than `b`. */
export function isNewer(a: Card, b: Card): boolean {
	const ta = a.last_review ? +new Date(a.last_review) : 0;
	const tb = b.last_review ? +new Date(b.last_review) : 0;
	return ta !== tb ? ta > tb : a.reps > b.reps;
}

export function letterStatus(cards: Cards, char: string): LetterStatus {
	const cs = SKILLS.map((s) => cards[cardKey(s, char)]);
	if (cs.every((c) => !c)) return 'unseen';
	const known = cs.every((c) => c && c.state === State.Review && c.stability >= KNOWN_STABILITY_DAYS);
	return known ? 'known' : 'learning';
}

export const dueCount = (cards: Cards, now: Date) => Object.values(cards).filter((c) => +c.due <= +now).length;
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add FSRS helpers and letter status"`

---

### Task 4: Distractors

**Files:** Create `src/lib/options.ts`, `src/lib/options.test.ts`.

**Interfaces:**
- Consumes `LETTERS`, `byChar` (Task 2), `Skill` (Task 3).
- Produces `type Rng = () => number`, `shuffle<T>(xs, rng): T[]`, `interface OptionContext { known: Set<string>; confusions: Record<string, Record<string, number>>; rng: Rng }`, `pickDistractors(target, skill, n, ctx): string[]`, `buildOptions(target, skill, n, ctx): string[]` (length n + 1, values are letter chars).

- [ ] **Step 1: Write the failing test** — `src/lib/options.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { LETTERS, byChar } from './letters';
import { buildOptions, pickDistractors, type OptionContext } from './options';

function seeded(seed = 1) {
	let s = seed;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const ctx = (over: Partial<OptionContext> = {}): OptionContext => ({ known: new Set(), confusions: {}, rng: seeded(), ...over });

describe('options', () => {
	it('returns exactly n unique distractors without the target', () => {
		for (const l of LETTERS)
			for (const skill of ['read', 'recall'] as const)
				for (let n = 2; n <= 5; n++) {
					const d = pickDistractors(l.char, skill, n, ctx());
					expect(d).toHaveLength(n);
					expect(new Set(d).size).toBe(n);
					expect(d).not.toContain(l.char);
				}
	});

	it('puts past mistakes first, most frequent first', () => {
		const d = pickDistractors('ა', 'read', 3, ctx({ confusions: { 'ა': { 'ო': 1, 'ჰ': 3 } } }));
		expect(d.slice(0, 2)).toEqual(['ჰ', 'ო']);
	});

	it('uses same-sound-group letters for read', () => {
		const d = pickDistractors('ქ', 'read', 3, ctx());
		for (const c of d) expect(byChar.get(c)!.group).toBe('velar');
	});

	it('uses look-alike glyphs for recall', () => {
		expect(pickDistractors('მ', 'recall', 3, ctx()).sort()).toEqual(['შ', 'ძ', 'ნ'].sort());
	});

	it('builds n + 1 options containing the target once', () => {
		const o = buildOptions('ა', 'recall', 5, ctx());
		expect(o).toHaveLength(6);
		expect(o.filter((c) => c === 'ა')).toHaveLength(1);
	});
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** — `src/lib/options.ts`

```ts
import { LETTERS, byChar } from './letters';
import type { Skill } from './srs';

export type Rng = () => number;

export interface OptionContext {
	/** Letters already introduced to this learner. */
	known: Set<string>;
	/** confusions[target][picked] = how often `picked` was chosen for `target`. */
	confusions: Record<string, Record<string, number>>;
	rng: Rng;
}

export function shuffle<T>(xs: T[], rng: Rng): T[] {
	const a = [...xs];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function pickDistractors(target: string, skill: Skill, n: number, ctx: OptionContext): string[] {
	const letter = byChar.get(target)!;
	const mistakes = Object.entries(ctx.confusions[target] ?? {})
		.sort((a, b) => b[1] - a[1])
		.map(([c]) => c);
	const similar = skill === 'read' ? LETTERS.filter((l) => l.group === letter.group).map((l) => l.char) : letter.looksLike;
	const tiers = [mistakes, shuffle(similar, ctx.rng), shuffle([...ctx.known], ctx.rng), shuffle(LETTERS.map((l) => l.char), ctx.rng)];

	const out: string[] = [];
	for (const c of tiers.flat()) {
		if (out.length === n) break;
		if (c !== target && !out.includes(c)) out.push(c);
	}
	return out;
}

export const buildOptions = (target: string, skill: Skill, n: number, ctx: OptionContext) =>
	shuffle([target, ...pickDistractors(target, skill, n, ctx)], ctx.rng);
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: pick distractors from mistakes, similar letters, known letters"`

---

### Task 5: Session scheduler

**Files:** Create `src/lib/session.ts`, `src/lib/session.test.ts`.

**Interfaces:**
- Consumes `LETTERS`, `parseKey`, `Cards`, `Skill`.
- Produces `type Task = { kind: 'intro'; char } | { kind: 'question'; skill; char; key } | { kind: 'done'; nextDue: Date | null }`, `nextTask(cards, now, lastKey?): Task`, `MAX_LEARNING_LETTERS = 4`, `LOOKAHEAD_MS`, `SESSION_LENGTH = 20`.

- [ ] **Step 1: Write the failing test** — `src/lib/session.test.ts`

```ts
import { State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { LETTERS } from './letters';
import { nextTask } from './session';
import { newCard, type Cards } from './srs';

const now = new Date('2026-01-01T00:00:00Z');
const at = (min: number) => new Date(+now + min * 60_000);

function cardsFor(chars: string[], patch: object): Cards {
	const cards: Cards = {};
	for (const c of chars) for (const s of ['read', 'recall']) cards[`${s}:${c}`] = { ...newCard(now), ...patch };
	return cards;
}

describe('nextTask', () => {
	it('introduces the first letter to a new learner', () => {
		expect(nextTask({}, now)).toEqual({ kind: 'intro', char: LETTERS[0].char });
	});

	it('asks due cards before introducing anything', () => {
		const task = nextTask(cardsFor(['ა'], {}), now);
		expect(task).toMatchObject({ kind: 'question', char: 'ა' });
	});

	it('avoids repeating the card just asked', () => {
		expect(nextTask(cardsFor(['ა'], {}), now, 'read:ა')).toMatchObject({ key: 'recall:ა', skill: 'recall' });
	});

	it('introduces the next letter while fewer than four are in learning', () => {
		const cards = cardsFor(['ა'], { state: State.Learning, due: at(5) });
		expect(nextTask(cards, now)).toEqual({ kind: 'intro', char: LETTERS[1].char });
	});

	it('works on soon-due cards instead of introducing a fifth letter', () => {
		const cards = cardsFor(LETTERS.slice(0, 4).map((l) => l.char), { state: State.Learning, due: at(5) });
		expect(nextTask(cards, now)).toMatchObject({ kind: 'question' });
	});

	it('is done when every letter is in review and nothing is due soon', () => {
		const cards = cardsFor(LETTERS.map((l) => l.char), { state: State.Review, due: at(60 * 48) });
		expect(nextTask(cards, now)).toEqual({ kind: 'done', nextDue: at(60 * 48) });
	});
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** — `src/lib/session.ts`

```ts
import { State } from 'ts-fsrs';
import { LETTERS } from './letters';
import { parseKey, type Cards, type Skill } from './srs';

export type Task =
	| { kind: 'intro'; char: string }
	| { kind: 'question'; skill: Skill; char: string; key: string }
	| { kind: 'done'; nextDue: Date | null };

export const MAX_LEARNING_LETTERS = 4;
export const LOOKAHEAD_MS = 15 * 60_000;
export const SESSION_LENGTH = 20;

export function nextTask(cards: Cards, now: Date, lastKey?: string): Task {
	const entries = Object.entries(cards).sort(([, a], [, b]) => +a.due - +b.due);
	const ask = (list: typeof entries): Task => {
		const [key] = list.find(([k]) => k !== lastKey) ?? list[0];
		const { skill, item } = parseKey(key);
		return { kind: 'question', skill, char: item, key };
	};

	const due = entries.filter(([, c]) => +c.due <= +now);
	if (due.length) return ask(due);

	const introduced = new Set(entries.map(([k]) => parseKey(k).item));
	const learning = new Set(entries.filter(([, c]) => c.state !== State.Review).map(([k]) => parseKey(k).item));
	const fresh = LETTERS.find((l) => !introduced.has(l.char));
	if (fresh && learning.size < MAX_LEARNING_LETTERS) return { kind: 'intro', char: fresh.char };

	const soon = entries.filter(([, c]) => +c.due - +now <= LOOKAHEAD_MS);
	if (soon.length) return ask(soon);

	return { kind: 'done', nextDue: entries[0]?.[1].due ?? null };
}
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: decide the next intro or question"`

---

### Task 6: PocketBase schema

**Files:** Create `pb/pb_migrations/1758240000_init.js`.

**Interfaces:** Produces `users.lang` (select `vi|en`), `users.distractors` (number 2–5), collection `reviews { user, key, card, due, updated }`, unique `(user, key)`, owner-only rules.

- [ ] **Step 1: Write the migration**

```js
/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(new SelectField({ name: 'lang', values: ['vi', 'en'], maxSelect: 1 }));
		users.fields.add(new NumberField({ name: 'distractors', min: 2, max: 5, onlyInt: true }));
		app.save(users);

		const owner = 'user = @request.auth.id';
		const reviews = new Collection({
			type: 'base',
			name: 'reviews',
			listRule: owner,
			viewRule: owner,
			createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
			updateRule: `${owner} && (@request.body.user:isset = false || @request.body.user = @request.auth.id)`,
			deleteRule: owner,
			fields: [
				{ name: 'user', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
				{ name: 'key', type: 'text', required: true, max: 64 },
				{ name: 'card', type: 'json', required: true, maxSize: 4000 },
				{ name: 'due', type: 'date' },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: ['CREATE UNIQUE INDEX idx_reviews_user_key ON reviews (user, `key`)']
		});
		app.save(reviews);
	},
	(app) => {
		app.delete(app.findCollectionByNameOrId('reviews'));
		const users = app.findCollectionByNameOrId('users');
		users.fields.removeByName('lang');
		users.fields.removeByName('distractors');
		app.save(users);
	}
);
```

- [ ] **Step 2: Verify against a throwaway data dir**

```bash
./pb/pocketbase serve --dir /tmp/mk-pb --migrationsDir pb/pb_migrations --http 127.0.0.1:8091 &
sleep 2
./pb/pocketbase superuser upsert admin@example.com 'x1234567890' --dir /tmp/mk-pb
# sign up two users, create a review as A, check B cannot see it and A cannot write for B
```
Script the checks with `curl` against `http://127.0.0.1:8091/api/collections/...`:
- `POST users/records` with `{email,password,passwordConfirm,lang:"vi",distractors:3}` → 200.
- `POST users/auth-with-password` → token.
- `POST reviews/records` as A with `user=A` → 200; with `user=B` → 400/403.
- `GET reviews/records` as B → `totalItems: 0`.
- Duplicate `(user,key)` → 400.
Expected: all as listed. Then kill the server and `rm -rf /tmp/mk-pb`.

- [ ] **Step 3: Commit** — `git commit -m "feat: add profile fields and reviews collection"`

---

### Task 7: Client state, sync and i18n

**Files:** Create `src/lib/storage.ts`, `src/lib/pb.ts`, `src/lib/messages.ts`, `src/lib/i18n.ts`, `src/lib/i18n.test.ts`, `src/lib/settings.svelte.ts`, `src/lib/progress.svelte.ts`.

**Interfaces:**
- Produces `load<T>(key, fallback): T`, `save(key, value)`, `pb: PocketBase`.
- `messages.ts`: `vi`, `en`, `type MessageKey`, `messages`.
- `i18n.ts`: `format(template, params?)`, `translate(lang, key, params?)`, `relativeTime(date, now, lang)`.
- `settings.svelte.ts`: `settings: { lang, distractors }` ($state), `MIN_DISTRACTORS`, `MAX_DISTRACTORS`, `updateSettings(patch)`, `adoptProfile(user)`, `t(key, params?)`.
- `progress.svelte.ts`: `progress: { cards, confusions }` ($state), `introduce(char, now?)`, `answer(skill, char, chosen, ms, now?): boolean`, `push()`, `pull()`, `forgetRemote()`.

- [ ] **Step 1: Failing i18n test** — `src/lib/i18n.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { format, relativeTime, translate } from './i18n';
import { en, vi } from './messages';

describe('i18n', () => {
	it('has the same keys in both languages', () => {
		expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
	});

	it('fills parameters and leaves unknown ones', () => {
		expect(format('{n} of {total}', { n: 3 })).toBe('3 of {total}');
	});

	it('translates with parameters', () => {
		expect(translate('en', 'choicesValue', { n: 4 })).toBe('4 choices');
		expect(translate('vi', 'choicesValue', { n: 4 })).toBe('4 lựa chọn');
	});

	it('formats relative times', () => {
		const now = new Date('2026-01-01T00:00:00Z');
		expect(relativeTime(new Date(+now + 5 * 60_000), now, 'en')).toBe('in 5 minutes');
		expect(relativeTime(new Date(+now + 3 * 86_400_000), now, 'en')).toBe('in 3 days');
	});
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

`src/lib/storage.ts`
```ts
/** localStorage can be missing or full (private mode, quota); the app still runs from memory. */
export function load<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function save(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// memory-only for this session
	}
}
```

`src/lib/pb.ts`
```ts
import PocketBase from 'pocketbase';

/** Same origin: PocketBase serves the app in production, Vite proxies /api in dev. */
export const pb = new PocketBase('/');
```

`src/lib/messages.ts`
```ts
export const vi = {
	tagline: 'Học đọc 33 chữ cái tiếng Georgia',
	alphabet: 'Bảng chữ cái',
	settings: 'Cài đặt',
	start: 'Bắt đầu học',
	continue: 'Học tiếp',
	dueCount: '{n} thẻ cần ôn',
	nothingDue: 'Chưa có thẻ nào đến hạn',
	intro: 'Chạm vào một chữ để xem cách đọc, hoặc bắt đầu học để làm quen từng chữ.',
	summary: 'Đã thuộc {known} chữ, đang học {learning} chữ.',
	unseen: 'Chưa học',
	learning: 'Đang học',
	known: 'Đã thuộc',
	close: 'Đóng',
	stop: 'Dừng buổi học',
	progress: 'Tiến độ buổi học',
	newLetter: 'Chữ mới',
	gotIt: 'Đã nhớ, làm bài',
	promptRead: 'Chữ này đọc là gì?',
	promptRecall: 'Chữ nào có âm này?',
	choicesLabel: 'Các lựa chọn',
	youChose: 'Bạn chọn',
	correctAnswer: 'Đáp án đúng',
	next: 'Tiếp tục',
	sessionDone: 'Xong buổi học',
	allCaughtUp: 'Bạn đã ôn hết các thẻ đến hạn',
	sessionStats: 'Đúng {right}/{total} câu.',
	comeBack: 'Lần ôn tiếp theo: {time}.',
	keepGoing: 'Học thêm',
	backHome: 'Về trang chủ',
	language: 'Ngôn ngữ',
	choices: 'Số lựa chọn mỗi câu',
	choicesValue: '{n} lựa chọn',
	choicesHelp: 'Càng nhiều lựa chọn thì càng khó đoán mò.',
	account: 'Tài khoản',
	accountHelp: 'Không bắt buộc. Đăng nhập để đồng bộ tiến độ giữa điện thoại và máy tính.',
	email: 'Email',
	password: 'Mật khẩu (ít nhất 8 ký tự)',
	signIn: 'Đăng nhập',
	signUp: 'Tạo tài khoản',
	signOut: 'Đăng xuất',
	signedInAs: 'Đang đăng nhập bằng {email}.',
	signInFailed: 'Email hoặc mật khẩu không đúng.',
	signUpFailed: 'Không tạo được tài khoản. Email có thể đã được dùng.'
};

export type MessageKey = keyof typeof vi;

export const en: Record<MessageKey, string> = {
	tagline: 'Learn to read the 33 Georgian letters',
	alphabet: 'Alphabet',
	settings: 'Settings',
	start: 'Start learning',
	continue: 'Continue',
	dueCount: '{n} cards to review',
	nothingDue: 'Nothing to review yet',
	intro: 'Tap a letter to see how it reads, or start learning to meet them one by one.',
	summary: '{known} known, {learning} in progress.',
	unseen: 'Not started',
	learning: 'Learning',
	known: 'Known',
	close: 'Close',
	stop: 'Stop session',
	progress: 'Session progress',
	newLetter: 'New letter',
	gotIt: 'Got it, quiz me',
	promptRead: 'How does this letter read?',
	promptRecall: 'Which letter has this sound?',
	choicesLabel: 'Choices',
	youChose: 'You chose',
	correctAnswer: 'Correct answer',
	next: 'Continue',
	sessionDone: 'Session complete',
	allCaughtUp: 'You have reviewed everything that is due',
	sessionStats: '{right} of {total} correct.',
	comeBack: 'Next review {time}.',
	keepGoing: 'Keep going',
	backHome: 'Back to home',
	language: 'Language',
	choices: 'Choices per question',
	choicesValue: '{n} choices',
	choicesHelp: 'More choices make guessing harder.',
	account: 'Account',
	accountHelp: 'Optional. Sign in to sync progress between your phone and computer.',
	email: 'Email',
	password: 'Password (at least 8 characters)',
	signIn: 'Sign in',
	signUp: 'Create account',
	signOut: 'Sign out',
	signedInAs: 'Signed in as {email}.',
	signInFailed: 'Wrong email or password.',
	signUpFailed: 'Could not create the account. The email may already be in use.'
};

export const messages = { vi, en };
```

`src/lib/i18n.ts`
```ts
import type { Lang } from './letters';
import { messages, type MessageKey } from './messages';

export type Params = Record<string, string | number>;

export const format = (template: string, params: Params = {}) =>
	template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

export const translate = (lang: Lang, key: MessageKey, params?: Params) => format(messages[lang][key], params);

export function relativeTime(date: Date, now: Date, lang: Lang): string {
	const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
	const minutes = Math.round((+date - +now) / 60_000);
	if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
	return rtf.format(Math.round(hours / 24), 'day');
}
```

`src/lib/settings.svelte.ts`
```ts
import type { RecordModel } from 'pocketbase';
import { translate, type Params } from './i18n';
import type { Lang } from './letters';
import type { MessageKey } from './messages';
import { pb } from './pb';
import { load, save } from './storage';

export const MIN_DISTRACTORS = 2;
export const MAX_DISTRACTORS = 5;

export interface Settings {
	lang: Lang;
	distractors: number;
}

const detectLang = (): Lang => (navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en');

export const settings = $state<Settings>(load('settings', { lang: detectLang(), distractors: 3 }));

export function updateSettings(patch: Partial<Settings>) {
	Object.assign(settings, patch);
	save('settings', settings);
	const user = pb.authStore.record;
	// ponytail: fire-and-forget; an offline change is replaced by the profile at the next sign-in
	if (user) pb.collection('users').update(user.id, patch).catch(() => {});
}

/** On sign-in the stored profile wins; an empty profile takes this device's settings. */
export async function adoptProfile(user: RecordModel) {
	if (user.lang && user.distractors) {
		Object.assign(settings, { lang: user.lang, distractors: user.distractors });
		save('settings', settings);
	} else {
		await pb.collection('users').update(user.id, { lang: settings.lang, distractors: settings.distractors });
	}
}

export const t = (key: MessageKey, params?: Params) => translate(settings.lang, key, params);
```

`src/lib/progress.svelte.ts`
```ts
import { pb } from './pb';
import { cardKey, gradeAnswer, isNewer, newCard, reviewCard, reviveCard, SKILLS, type Cards, type Skill } from './srs';
import { load, save } from './storage';

type Confusions = Record<string, Record<string, number>>;

const revive = (raw: Cards): Cards => Object.fromEntries(Object.entries(raw).map(([k, c]) => [k, reviveCard(c)]));

export const progress = $state({
	cards: revive(load<Cards>('cards', {})),
	confusions: load<Confusions>('confusions', {})
});

/** Keys changed on this device and not yet stored in PocketBase. */
const dirty = new Set<string>(load<string[]>('dirty', []));
let remoteIds = load<Record<string, string>>('remoteIds', {});
let pushing = false;

function persist() {
	save('cards', progress.cards);
	save('confusions', progress.confusions);
	save('dirty', [...dirty]);
	save('remoteIds', remoteIds);
}

export function introduce(char: string, now = new Date()) {
	for (const skill of SKILLS) {
		const key = cardKey(skill, char);
		if (progress.cards[key]) continue;
		progress.cards[key] = newCard(now);
		dirty.add(key);
	}
	persist();
	void push();
}

export function answer(skill: Skill, char: string, chosen: string, ms: number, now = new Date()): boolean {
	const key = cardKey(skill, char);
	const correct = chosen === char;
	progress.cards[key] = reviewCard(progress.cards[key], gradeAnswer(correct, ms), now);
	if (!correct) {
		const row = (progress.confusions[char] ??= {});
		row[chosen] = (row[chosen] ?? 0) + 1;
	}
	dirty.add(key);
	persist();
	void push();
	return correct;
}

export async function push() {
	const user = pb.authStore.record;
	if (!user || pushing || !navigator.onLine) return;
	pushing = true;
	try {
		for (const key of [...dirty]) {
			const card = progress.cards[key];
			const data = { user: user.id, key, card, due: card.due };
			if (remoteIds[key]) await pb.collection('reviews').update(remoteIds[key], data);
			else remoteIds[key] = (await pb.collection('reviews').create(data)).id;
			dirty.delete(key);
		}
	} catch {
		// remaining keys stay dirty; retried on the next answer or when the device is back online
	} finally {
		pushing = false;
		persist();
	}
}

/** Merge the account's cards into this device, keeping whichever copy saw more practice. */
export async function pull() {
	if (!pb.authStore.record) return;
	const records = await pb.collection('reviews').getFullList({ fields: 'id,key,card' });
	remoteIds = {};
	for (const r of records) {
		remoteIds[r.key] = r.id;
		const remote = reviveCard(r.card);
		const local = progress.cards[r.key];
		if (!local || isNewer(remote, local)) {
			progress.cards[r.key] = remote;
			dirty.delete(r.key);
		} else if (isNewer(local, remote)) dirty.add(r.key);
	}
	for (const key of Object.keys(progress.cards)) if (!remoteIds[key]) dirty.add(key);
	persist();
	await push();
}

/** After sign-out the device keeps its progress; all of it is offered to the next account. */
export function forgetRemote() {
	remoteIds = {};
	for (const key of Object.keys(progress.cards)) dirty.add(key);
	persist();
}
```

- [ ] **Step 4: Run** — `npm test && npm run check` → all PASS, 0 errors.
- [ ] **Step 5: Commit** — `git commit -m "feat: local-first progress with PocketBase sync and vi/en strings"`

---

### Task 8: Design system and layout

**Files:** Create `src/app.css`, `src/lib/components/Staff.svelte`, `src/lib/components/Icon.svelte`, `src/routes/+layout.svelte`.

**Interfaces:** Produces CSS tokens (`--paper --tile --ink --muted --rule --rule-strong --lapis --on-lapis --ok --bad --font-glyph --font-ui --staff-*`), classes `.page .bar .btn .btn.primary .icon-btn .muted`, `<Staff char size? tone? />` (tone = token name without `--`), `<Icon name="settings|close|back" />`.

Design plan (from the spec): cool copybook paper, indigo ink, lapis for learning and actions, turquoise/pomegranate for right/wrong. The four-line copybook staff is the single bold element; no cards, shadows or gradients elsewhere. Glyph font Noto Serif Georgian, UI font Lexend. Left-aligned text, centred glyphs.

- [ ] **Step 1: `src/app.css`**

```css
:root {
	--paper: #eef2f7;
	--tile: #f8fafc;
	--ink: #16233f;
	--muted: #56637d;
	--rule: #c3cee0;
	--rule-strong: #8fa0bf;
	--lapis: #2a55c0;
	--on-lapis: #ffffff;
	--ok: #13806f;
	--bad: #b42a33;
	--font-glyph: 'Noto Serif Georgian Variable', 'Noto Serif Georgian', serif;
	--font-ui: 'Lexend Variable', 'Lexend', system-ui, sans-serif;
	/* Noto Serif Georgian at line-height 1.36: line positions from the top of the line box.
	   Calibration knob if a font update shifts the glyphs. */
	--staff-asc: 0.296em;
	--staff-x: 0.52em;
	--staff-base: 1.068em;
	--staff-desc: 1.32em;
	--radius: 14px;
	color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
	:root {
		--paper: #0e1629;
		--tile: #141f38;
		--ink: #e4eaf5;
		--muted: #98a4bd;
		--rule: #25355a;
		--rule-strong: #3f5488;
		--lapis: #8aa8ff;
		--on-lapis: #0e1629;
		--ok: #45c6b0;
		--bad: #f2767d;
	}
}

*, *::before, *::after { box-sizing: border-box; }

body {
	margin: 0;
	min-height: 100dvh;
	background: var(--paper);
	color: var(--ink);
	font-family: var(--font-ui);
	font-size: 1rem;
	line-height: 1.5;
	-webkit-tap-highlight-color: transparent;
}

h1, h2, p { margin: 0; }
button, input { font: inherit; color: inherit; }
a { color: var(--lapis); }
:focus-visible { outline: 3px solid var(--lapis); outline-offset: 3px; border-radius: 4px; }

.page {
	max-width: 560px;
	min-height: 100dvh;
	margin: 0 auto;
	padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.bar { display: flex; align-items: center; gap: 12px; min-height: 48px; }

.muted { color: var(--muted); }

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 52px;
	padding: 0 22px;
	border: 1.5px solid var(--rule-strong);
	border-radius: var(--radius);
	background: transparent;
	font-weight: 500;
	text-decoration: none;
	color: var(--ink);
	cursor: pointer;
}
.btn.primary { background: var(--lapis); border-color: var(--lapis); color: var(--on-lapis); }
.btn:disabled { opacity: 0.55; cursor: default; }

.icon-btn {
	display: inline-grid;
	place-items: center;
	width: 48px;
	height: 48px;
	border-radius: 50%;
	color: var(--ink);
}
.icon-btn:hover { background: var(--tile); }

@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 2: `src/lib/components/Staff.svelte`**

```svelte
<script lang="ts">
	let { char, size = '8rem', tone = 'ink' }: { char: string; size?: string; tone?: string } = $props();
</script>

<span class="staff" lang="ka" style:font-size={size} style:color="var(--{tone})">{char}</span>

<style>
	/* Georgian copybook: ascender, x-height, baseline (heavier), descender. */
	.staff {
		display: block;
		height: 1.36em;
		font-family: var(--font-glyph);
		line-height: 1.36;
		text-align: center;
		background:
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-asc) / 100% 1px no-repeat,
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-x) / 100% 1px no-repeat,
			linear-gradient(var(--rule-strong), var(--rule-strong)) 0 var(--staff-base) / 100% 2px no-repeat,
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-desc) / 100% 1px no-repeat;
	}
</style>
```

- [ ] **Step 3: `src/lib/components/Icon.svelte`**

```svelte
<script lang="ts">
	let { name }: { name: 'settings' | 'close' | 'back' } = $props();
</script>

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	{#if name === 'settings'}
		<circle cx="12" cy="12" r="3" />
		<path d="M12 2.5v3M12 18.5v3M4.2 6.5l2.6 1.5M17.2 16l2.6 1.5M4.2 17.5l2.6-1.5M17.2 8l2.6-1.5" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else}
		<path d="M15 5l-7 7 7 7" />
	{/if}
</svg>
```

- [ ] **Step 4: `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
	import '@fontsource-variable/noto-serif-georgian';
	import '@fontsource-variable/lexend';
	import '../app.css';
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import { pull, push } from '$lib/progress.svelte';
	import { adoptProfile, settings } from '$lib/settings.svelte';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = settings.lang;
	});

	onMount(() => {
		if (pb.authStore.isValid) {
			pb.collection('users')
				.authRefresh()
				.then(({ record }) => adoptProfile(record))
				.then(pull)
				.catch(() => {});
		}
		const online = () => void push();
		addEventListener('online', online);
		return () => removeEventListener('online', online);
	});
</script>

{@render children()}
```

- [ ] **Step 5: Verify** — `npm run check` → 0 errors. Commit: `git commit -m "feat: design tokens, copybook staff, layout"`

---

### Task 9: Home page (alphabet as a copybook page)

**Files:** Replace `src/routes/+page.svelte`; create `src/lib/components/LetterSheet.svelte`.

**Interfaces:** Consumes `ALPHABET`, `progress`, `letterStatus`, `dueCount`, `t`, `settings`, `Staff`, `Icon`.

Wireframe (mobile):
```
მხედრული                              [⚙]
Mkhedruli · tagline (muted)
┌ copybook rows: 6 glyphs per row on continuous staff lines ┐
│ ა ბ გ დ ე ვ   (colour = status; sound under seen letters) │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
legend: ● Not started ● Learning ● Known
summary line
[        Continue        ]   (sticky bottom)
 8 cards to review
```

- [ ] **Step 1: `src/lib/components/LetterSheet.svelte`**

```svelte
<script lang="ts">
	import type { Letter } from '$lib/letters';
	import { settings, t } from '$lib/settings.svelte';
	import Staff from './Staff.svelte';

	let { letter, onclose }: { letter: Letter | null; onclose: () => void } = $props();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (letter && !dialog.open) dialog.showModal();
		if (!letter && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} {onclose} onclick={(e) => e.target === dialog && dialog.close()}>
	{#if letter}
		<div class="sheet">
			<Staff char={letter.char} size="7.5rem" />
			<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint">{letter.hint[settings.lang]}</p>
			<button class="btn" onclick={() => dialog.close()}>{t('close')}</button>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: 560px;
		margin: auto auto 0;
		padding: 24px 16px max(24px, env(safe-area-inset-bottom));
		border: 0;
		border-radius: 24px 24px 0 0;
		background: var(--paper);
		color: var(--ink);
	}
	dialog::backdrop { background: rgb(14 22 41 / 0.5); }
	@media (min-width: 640px) {
		dialog { margin: auto; border-radius: 24px; }
	}
	.sheet { display: flex; flex-direction: column; gap: 16px; }
	.sound { font-size: 2rem; font-weight: 600; text-align: center; }
	.sound .muted { font-size: 1.1rem; font-weight: 400; }
	.hint { max-width: 60ch; }
</style>
```

- [ ] **Step 2: `src/routes/+page.svelte`**

```svelte
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import LetterSheet from '$lib/components/LetterSheet.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { ALPHABET, type Letter } from '$lib/letters';
	import { progress } from '$lib/progress.svelte';
	import { t } from '$lib/settings.svelte';
	import { dueCount, letterStatus, type LetterStatus } from '$lib/srs';

	const tone: Record<LetterStatus, string> = { unseen: 'rule-strong', learning: 'lapis', known: 'ink' };

	const status = $derived(Object.fromEntries(ALPHABET.map((l) => [l.char, letterStatus(progress.cards, l.char)])) as Record<string, LetterStatus>);
	const known = $derived(Object.values(status).filter((s) => s === 'known').length);
	const learning = $derived(Object.values(status).filter((s) => s === 'learning').length);
	const due = $derived(dueCount(progress.cards, new Date()));
	const started = $derived(known + learning > 0);

	let selected = $state<Letter | null>(null);
</script>

<main class="page">
	<header class="top">
		<div>
			<h1 lang="ka">მხედრული</h1>
			<p class="muted"><span lang="en">Mkhedruli</span>. {t('tagline')}</p>
		</div>
		<a class="icon-btn" href="/settings" aria-label={t('settings')}><Icon name="settings" /></a>
	</header>

	<ol class="alphabet" aria-label={t('alphabet')}>
		{#each ALPHABET as letter (letter.char)}
			{@const s = status[letter.char]}
			<li>
				<button class="tile" onclick={() => (selected = letter)} aria-label="{letter.char}, {t(s)}">
					<Staff char={letter.char} size="2.4rem" tone={tone[s]} />
					<span class="translit" class:hidden={s === 'unseen'}>{letter.translit}</span>
				</button>
			</li>
		{/each}
	</ol>

	<div class="legend">
		<ul>
			{#each ['unseen', 'learning', 'known'] as const as s (s)}
				<li><i style:background="var(--{tone[s]})"></i>{t(s)}</li>
			{/each}
		</ul>
		<p class="muted">{started ? t('summary', { known, learning }) : t('intro')}</p>
	</div>

	<footer class="cta">
		<a class="btn primary" href="/learn">{started ? t('continue') : t('start')}</a>
		{#if started}<p class="muted">{due ? t('dueCount', { n: due }) : t('nothingDue')}</p>{/if}
	</footer>
</main>

<LetterSheet letter={selected} onclose={() => (selected = null)} />

<style>
	.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
	h1 {
		font-family: var(--font-glyph);
		font-size: clamp(2.2rem, 9vw, 3rem);
		font-weight: 600;
		line-height: 1.2;
	}

	.alphabet {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		row-gap: 8px;
	}
	@media (min-width: 520px) {
		.alphabet { grid-template-columns: repeat(11, 1fr); }
	}
	.tile {
		width: 100%;
		min-height: 48px;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}
	.tile:hover :global(.staff) { background-color: var(--tile); }
	.translit { font-size: 0.8rem; color: var(--muted); text-align: center; min-height: 1.2em; }
	.translit.hidden { visibility: hidden; }

	.legend { display: flex; flex-direction: column; gap: 8px; }
	.legend ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.9rem; }
	.legend li { display: flex; align-items: center; gap: 8px; }
	.legend i { width: 10px; height: 10px; border-radius: 50%; }

	.cta {
		position: sticky;
		bottom: 0;
		margin-top: auto;
		padding: 12px 0 max(4px, env(safe-area-inset-bottom));
		background: var(--paper);
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-align: center;
	}
</style>
```

- [ ] **Step 3: Verify** — `npm run check` → 0 errors; `npm run dev`, open http://localhost:5173 at 390×844 and 1280×800 in the browser, take screenshots; staff lines continuous across each row, glyphs sit on the heavy baseline, sheet opens and closes, keyboard focus visible.
- [ ] **Step 4: Commit** — `git commit -m "feat: home page with alphabet copybook and letter sheet"`

---

### Task 10: Learn page

**Files:** Create `src/routes/learn/+page.svelte`.

**Interfaces:** Consumes `nextTask`, `SESSION_LENGTH`, `Task` (Task 5); `buildOptions` (Task 4); `progress`, `answer`, `introduce` (Task 7); `settings`, `t`, `relativeTime`; `byChar`; `parseKey`; `Staff`, `Icon`.

Behaviour:
- Intro → glyph on staff (lapis), sound, IPA, hint, "Got it, quiz me" → `introduce(char)`.
- Question → prompt glyph (`read`) or sound (`recall`); `settings.distractors + 1` options in a 2-column grid (3 columns ≥ 520px when more than 4). Keys `1`–`6` choose.
- Right → option turns `--ok`, next task after 700 ms.
- Wrong → picked option `--bad`, right one `--ok`, comparison panel (picked vs correct, both on staff with sounds) and hint; "Continue" or Enter advances.
- After 20 answers → "Session complete" with score and "Keep going"; when nothing is due → "You have reviewed everything that is due" with next review time.

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { relativeTime } from '$lib/i18n';
	import { byChar } from '$lib/letters';
	import { buildOptions } from '$lib/options';
	import { answer, introduce, progress } from '$lib/progress.svelte';
	import { nextTask, SESSION_LENGTH, type Task } from '$lib/session';
	import { settings, t } from '$lib/settings.svelte';
	import { parseKey } from '$lib/srs';

	let task = $state<Task>({ kind: 'done', nextDue: null });
	let options = $state<string[]>([]);
	let chosen = $state<string | null>(null);
	let answered = $state(0);
	let right = $state(0);
	let paused = $state(false);
	let shownAt = 0;
	let lastKey: string | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const letter = $derived(task.kind === 'done' ? null : byChar.get(task.char)!);
	const wrong = $derived(task.kind === 'question' && chosen !== null && chosen !== task.char);
	const picked = $derived(chosen ? byChar.get(chosen)! : null);

	function show(next: Task) {
		clearTimeout(timer);
		task = next;
		chosen = null;
		if (next.kind !== 'question') return;
		const known = new Set(Object.keys(progress.cards).map((k) => parseKey(k).item));
		options = buildOptions(next.char, next.skill, settings.distractors, { known, confusions: progress.confusions, rng: Math.random });
		shownAt = performance.now();
	}

	function advance() {
		const next = nextTask(progress.cards, new Date(), lastKey);
		paused = answered >= SESSION_LENGTH && next.kind !== 'done';
		show(paused ? { kind: 'done', nextDue: null } : next);
	}

	function keepGoing() {
		answered = 0;
		right = 0;
		advance();
	}

	function choose(option: string) {
		if (task.kind !== 'question' || chosen) return;
		chosen = option;
		lastKey = task.key;
		answered += 1;
		if (answer(task.skill, task.char, option, performance.now() - shownAt)) {
			right += 1;
			timer = setTimeout(advance, 700);
		}
	}

	function learnt() {
		if (task.kind !== 'intro') return;
		introduce(task.char);
		advance();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (task.kind === 'question' && !chosen) {
			const i = Number(e.key) - 1;
			if (Number.isInteger(i) && i >= 0 && i < options.length) choose(options[i]);
			return;
		}
		// a focused button already handles Enter/Space itself
		if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
			if (task.kind === 'intro') learnt();
			else if (wrong) advance();
			else return;
			e.preventDefault();
		}
	}

	show(nextTask(progress.cards, new Date()));
</script>

<svelte:window {onkeydown} />

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label={t('stop')}><Icon name="close" /></a>
		<progress max={SESSION_LENGTH} value={answered} aria-label={t('progress')}></progress>
	</header>

	{#if task.kind === 'intro' && letter}
		<section class="stage">
			<p class="prompt">{t('newLetter')}</p>
			<Staff char={letter.char} size="min(11rem, 40vw)" tone="lapis" />
			<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint">{letter.hint[settings.lang]}</p>
		</section>
		<div class="actions"><button class="btn primary" onclick={learnt}>{t('gotIt')}</button></div>
	{:else if task.kind === 'question' && letter}
		<section class="stage">
			<p class="prompt">{task.skill === 'read' ? t('promptRead') : t('promptRecall')}</p>
			{#if task.skill === 'read'}
				<Staff char={letter.char} size={wrong ? '6rem' : 'min(11rem, 40vw)'} />
			{:else}
				<p class="prompt-sound">{letter.translit}</p>
			{/if}
		</section>

		{#if wrong && picked}
			<section class="compare" aria-live="polite">
				<div>
					<span class="muted">{t('youChose')}</span>
					<Staff char={picked.char} size="3.2rem" tone="bad" />
					<span class="sound-sm">{picked.translit}</span>
				</div>
				<div>
					<span class="muted">{t('correctAnswer')}</span>
					<Staff char={letter.char} size="3.2rem" tone="ok" />
					<span class="sound-sm">{letter.translit}</span>
				</div>
				<p class="hint">{letter.hint[settings.lang]}</p>
			</section>
		{/if}

		<div class="options" class:many={options.length > 4} role="group" aria-label={t('choicesLabel')}>
			{#each options as option, i (option)}
				{@const o = byChar.get(option)!}
				<button
					class="option"
					class:ok={chosen !== null && option === task.char}
					class:bad={chosen === option && option !== task.char}
					aria-disabled={chosen !== null}
					onclick={() => choose(option)}
				>
					<kbd>{i + 1}</kbd>
					{#if task.skill === 'read'}
						<span class="opt-sound">{o.translit}</span>
					{:else}
						<span class="opt-glyph" lang="ka">{o.char}</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if wrong}
			<div class="actions"><button class="btn primary" onclick={advance}>{t('next')}</button></div>
		{/if}
	{:else}
		<section class="stage done">
			<h1>{paused ? t('sessionDone') : t('allCaughtUp')}</h1>
			{#if answered}<p>{t('sessionStats', { right, total: answered })}</p>{/if}
			{#if task.kind === 'done' && task.nextDue}
				<p class="muted">{t('comeBack', { time: relativeTime(task.nextDue, new Date(), settings.lang) })}</p>
			{/if}
		</section>
		<div class="actions">
			{#if paused}<button class="btn primary" onclick={keepGoing}>{t('keepGoing')}</button>{/if}
			<a class="btn" href="/">{t('backHome')}</a>
		</div>
	{/if}
</main>

<style>
	progress {
		flex: 1;
		height: 6px;
		appearance: none;
		border: 0;
		border-radius: 3px;
		background: var(--rule);
		overflow: hidden;
	}
	progress::-webkit-progress-bar { background: var(--rule); }
	progress::-webkit-progress-value { background: var(--lapis); transition: width 0.3s; }
	progress::-moz-progress-bar { background: var(--lapis); }

	.stage { display: flex; flex-direction: column; gap: 16px; }
	.stage.done { flex: 1; justify-content: center; gap: 12px; }
	.done h1 { font-size: 1.6rem; font-weight: 600; }
	.prompt { color: var(--muted); }
	.prompt-sound {
		font-size: clamp(4rem, 22vw, 6.5rem);
		font-weight: 600;
		text-align: center;
		line-height: 1.3;
		padding: 0.3em 0;
		border-block: 1px solid var(--rule);
	}
	.sound { font-size: 2.2rem; font-weight: 600; text-align: center; }
	.sound .muted { font-size: 1.1rem; font-weight: 400; }
	.hint { max-width: 60ch; }

	.compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px 16px;
		text-align: center;
		font-size: 0.9rem;
	}
	.compare .hint { grid-column: 1 / -1; text-align: left; font-size: 1rem; }
	.sound-sm { font-size: 1.2rem; font-weight: 600; }

	.options {
		margin-top: auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	@media (min-width: 520px) {
		.options.many { grid-template-columns: repeat(3, 1fr); }
	}
	.option {
		position: relative;
		min-height: 76px;
		border: 1.5px solid var(--rule-strong);
		border-radius: var(--radius);
		background: var(--tile);
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}
	.option[aria-disabled='true'] { cursor: default; }
	.option.ok { background: var(--ok); border-color: var(--ok); color: var(--paper); }
	.option.bad { background: var(--bad); border-color: var(--bad); color: var(--paper); }
	.opt-sound { font-size: 1.7rem; font-weight: 600; }
	.opt-glyph { font-family: var(--font-glyph); font-size: 2.6rem; line-height: 1.3; }
	kbd {
		display: none;
		position: absolute;
		top: 6px;
		left: 10px;
		font-family: inherit;
		font-size: 0.75rem;
		color: var(--muted);
	}
	@media (hover: hover) and (pointer: fine) {
		kbd { display: block; }
		.option:hover:not([aria-disabled='true']) { border-color: var(--lapis); }
	}
	.option.ok kbd, .option.bad kbd { color: inherit; }

	.actions { display: flex; flex-direction: column; gap: 10px; padding-bottom: env(safe-area-inset-bottom); }
</style>
```

- [ ] **Step 2: Verify** — `npm run check` → 0 errors. In the browser at 390×844: complete an intro, answer one right (turns green, advances) and one wrong (comparison shows, Continue advances); set distractors to 5 and confirm 6 options; press `1`–`6` on desktop.
- [ ] **Step 3: Commit** — `git commit -m "feat: learn session with intro, two-way questions and feedback"`

---

### Task 11: Settings page

**Files:** Create `src/routes/settings/+page.svelte`.

**Interfaces:** Consumes `settings`, `updateSettings`, `adoptProfile`, `MIN_DISTRACTORS`, `MAX_DISTRACTORS`, `t`, `pb`, `pull`, `forgetRemote`, `Icon`.

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Lang } from '$lib/letters';
	import { pb } from '$lib/pb';
	import { forgetRemote, pull } from '$lib/progress.svelte';
	import { adoptProfile, MAX_DISTRACTORS, MIN_DISTRACTORS, settings, t, updateSettings } from '$lib/settings.svelte';

	const langs: { value: Lang; label: string }[] = [
		{ value: 'vi', label: 'Tiếng Việt' },
		{ value: 'en', label: 'English' }
	];

	let user = $state(pb.authStore.record);
	$effect(() => pb.authStore.onChange(() => (user = pb.authStore.record)));

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function signIn(create: boolean) {
		busy = true;
		error = '';
		try {
			const users = pb.collection('users');
			if (create) {
				await users.create({ email, password, passwordConfirm: password, lang: settings.lang, distractors: settings.distractors });
			}
			const { record } = await users.authWithPassword(email, password);
			await adoptProfile(record);
			await pull();
			password = '';
		} catch {
			error = t(create ? 'signUpFailed' : 'signInFailed');
		} finally {
			busy = false;
		}
	}

	function signOut() {
		pb.authStore.clear();
		forgetRemote();
	}
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label={t('backHome')}><Icon name="back" /></a>
		<h1>{t('settings')}</h1>
	</header>

	<section>
		<h2 id="lang-label">{t('language')}</h2>
		<div class="segmented" role="radiogroup" aria-labelledby="lang-label">
			{#each langs as l (l.value)}
				<label class:on={settings.lang === l.value}>
					<input type="radio" name="lang" value={l.value} checked={settings.lang === l.value} onchange={() => updateSettings({ lang: l.value })} />
					{l.label}
				</label>
			{/each}
		</div>
	</section>

	<section>
		<h2><label for="choices">{t('choices')}</label></h2>
		<div class="range">
			<input
				id="choices"
				type="range"
				min={MIN_DISTRACTORS}
				max={MAX_DISTRACTORS}
				step="1"
				value={settings.distractors}
				oninput={(e) => (settings.distractors = Number(e.currentTarget.value))}
				onchange={() => updateSettings({ distractors: settings.distractors })}
			/>
			<output for="choices">{t('choicesValue', { n: settings.distractors + 1 })}</output>
		</div>
		<p class="muted">{t('choicesHelp')}</p>
	</section>

	<section>
		<h2>{t('account')}</h2>
		{#if user}
			<p>{t('signedInAs', { email: user.email })}</p>
			<button class="btn" onclick={signOut}>{t('signOut')}</button>
		{:else}
			<p class="muted">{t('accountHelp')}</p>
			<form onsubmit={(e) => { e.preventDefault(); signIn(false); }}>
				<label>{t('email')}<input type="email" autocomplete="email" required bind:value={email} /></label>
				<label>{t('password')}<input type="password" autocomplete="current-password" minlength="8" required bind:value={password} /></label>
				{#if error}<p class="error" role="alert">{error}</p>{/if}
				<div class="row">
					<button class="btn primary" disabled={busy}>{t('signIn')}</button>
					<button class="btn" type="button" disabled={busy} onclick={(e) => e.currentTarget.form?.reportValidity() && signIn(true)}>{t('signUp')}</button>
				</div>
			</form>
		{/if}
	</section>
</main>

<style>
	.bar h1 { font-size: 1.3rem; font-weight: 600; }
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }

	.segmented { display: grid; grid-template-columns: 1fr 1fr; border: 1.5px solid var(--rule-strong); border-radius: var(--radius); overflow: hidden; }
	.segmented label { display: grid; place-items: center; min-height: 48px; cursor: pointer; }
	.segmented label.on { background: var(--lapis); color: var(--on-lapis); }
	.segmented label:has(input:focus-visible) { outline: 3px solid var(--lapis); outline-offset: -3px; }
	.segmented input { position: absolute; opacity: 0; pointer-events: none; }

	.range { display: flex; align-items: center; gap: 16px; }
	.range input { flex: 1; min-height: 48px; accent-color: var(--lapis); }
	.range output { min-width: 7em; font-weight: 600; }

	form { display: flex; flex-direction: column; gap: 12px; }
	form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
	form input {
		min-height: 48px;
		padding: 0 14px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 10px;
		background: var(--tile);
		font-size: 1rem;
	}
	.row { display: flex; flex-wrap: wrap; gap: 10px; }
	.error { color: var(--bad); }
</style>
```

- [ ] **Step 2: Verify** — `npm run check` → 0 errors. With `npm run pb` + `npm run dev`: switch language (all text changes, `<html lang>` updates), move the slider (learn page shows n+1 options), create an account, answer questions, sign in from a private window and confirm the cards arrive (home grid colours match).
- [ ] **Step 3: Commit** — `git commit -m "feat: settings for language, choices and optional account"`

---

### Task 12: Offline PWA and final verification

**Files:** Create `src/service-worker.ts`, `static/manifest.webmanifest`, `static/icon-192.png`, `static/icon-512.png`.

- [ ] **Step 1: Service worker** — `src/service-worker.ts`

```ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `mkhedruli-${version}`;
const ASSETS = ['/', ...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	const skip = event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_/');
	if (skip) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			try {
				return await fetch(event.request);
			} catch {
				// offline: any app route falls back to the SPA shell
				return (await cache.match(event.request)) ?? (await cache.match('/')) ?? Response.error();
			}
		})()
	);
});
```

- [ ] **Step 2: Manifest** — `static/manifest.webmanifest`

```json
{
	"name": "Mkhedruli",
	"short_name": "Mkhedruli",
	"description": "Learn to read the 33 letters of the Georgian alphabet.",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#eef2f7",
	"theme_color": "#2a55c0",
	"icons": [
		{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
	]
}
```

- [ ] **Step 3: Icons** — render ა in Noto Serif Georgian, paper colour on lapis, glyph inside the maskable safe zone (60% of the canvas):

```bash
python3 - <<'EOF'
from PIL import Image, ImageDraw, ImageFont
for size in (192, 512):
    im = Image.new('RGB', (size, size), '#2a55c0')
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype('NotoSerifGeorgian.ttf', int(size * 0.62))
    d.text((size / 2, size * 0.53), 'ა', font=f, fill='#eef2f7', anchor='mm')
    im.save(f'static/icon-{size}.png')
EOF
```
(`NotoSerifGeorgian.ttf` from `github.com/google/fonts/ofl/notoserifgeorgian`, not committed.)

- [ ] **Step 4: Full verification**

```bash
npm test && npm run check && npm run build && npm run pb
```
Open http://127.0.0.1:8090 (served by PocketBase): screenshots at 390×844 and 1280×800 of home, learn (intro, right, wrong, 6 options), settings, dark mode. DevTools → Application: service worker active; offline reload of `/learn` still works.

- [ ] **Step 5: Commit** — `git commit -m "feat: installable offline PWA"`

---

## Self-review

- Spec coverage: two skills (T3, T5, T10); 2–5 distractors with tiered priority (T4, T11); FSRS grading and next-task rules (T3, T5); session of 20 (T10); vi/en stored in profile or locally (T7, T11); local-first sync with merge rule (T3 `isNewer`, T7); owner-only schema (T6); mobile-first + desktop keys (T8–T10); offline PWA (T12); MIT (T1); copybook staff design (T8–T9).
- Names used across tasks: `cardKey`, `parseKey`, `buildOptions`, `nextTask`, `SESSION_LENGTH`, `introduce`, `answer`, `pull`, `push`, `forgetRemote`, `adoptProfile`, `updateSettings`, `t`, `relativeTime`, `Staff`, `Icon`, `LetterSheet` — each defined once, signatures match.
