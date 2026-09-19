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
