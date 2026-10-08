"""Downloads every recording out of PocketBase, for listening or for building a training set.

Pulls all rows, including the ones still waiting for review, writes each take to disk and leaves a
manifest beside them. The `item` field is the catalogue key from src/lib/recording.ts, so it is also
the label of what was read.

    cd ~/works/learn-mkhedruli && set -a && . ~/works/mydevops/.env && set +a
    PB_URL=https://anbani.korbvazi.com \
      PB_SUPERUSER_EMAIL="$ANBANI_PB_SUPERUSER_EMAIL" \
      PB_SUPERUSER_PASSWORD="$ANBANI_PB_SUPERUSER_PASSWORD" \
      python3 scripts/fetch-recordings.py ~/anbani-voices

Takes are Opus in a WebM container, one channel at 16 kHz. To turn the lot into the 16 kHz mono WAV
most speech tooling wants:

    for f in ~/anbani-voices/audio/*.webm; do ffmpeg -v error -i "$f" -ac 1 -ar 16000 "${f%.webm}.wav"; done
"""

import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

BASE = os.environ.get("PB_URL", "http://127.0.0.1:8090").rstrip("/")
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "recordings")


def get(path, payload=None, token=None, raw=False, method=None):
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method or ("POST" if payload is not None else "GET"),
        headers=headers,
    )
    with urllib.request.urlopen(req) as r:
        body = r.read()
        return body if raw else json.loads(body)


def seconds(path):
    """Duration from ffprobe, so the manifest says how long each take runs; None without ffprobe."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
            capture_output=True, text=True, check=True,
        )
        return round(float(out.stdout.strip()), 2)
    except (OSError, subprocess.CalledProcessError, ValueError):
        return None


token = get(
    "/api/collections/_superusers/auth-with-password",
    {"identity": os.environ["PB_SUPERUSER_EMAIL"], "password": os.environ["PB_SUPERUSER_PASSWORD"]},
)["token"]

# Takes are protected files: the file route ignores the Authorization header and wants a token of its
# own, which lasts three minutes, so a long download renews it as it goes.
file_token, minted = "", 0.0


def take_url(row, name):
    global file_token, minted
    if time.monotonic() - minted > 120:
        file_token = get("/api/files/token", {}, token=token, method="POST")["token"]
        minted = time.monotonic()
    return f"/api/files/{row['collectionId']}/{row['id']}/{urllib.parse.quote(name)}?token={file_token}"

audio_dir = os.path.join(OUT, "audio")
os.makedirs(audio_dir, exist_ok=True)

rows, page = [], 1
while True:
    batch = get(f"/api/collections/recordings/records?perPage=200&page={page}&sort=item", token=token)
    rows += batch["items"]
    if page >= batch["totalPages"]:
        break
    page += 1

manifest = []
for row in rows:
    for take, name in enumerate(row["audio"], start=1):
        path = os.path.join(audio_dir, name)
        with open(path, "wb") as f:
            f.write(get(take_url(row, name), raw=True))
        manifest.append({
            "item": row["item"],
            "take": take,
            "file": os.path.join("audio", name),
            "bytes": os.path.getsize(path),
            "seconds": seconds(path),
            "status": row["status"],
            "reader": row["reader"],
            "recorded": row["created"],
        })

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent="\t")

if not manifest:
    print(f"nothing recorded yet on {BASE}")
    raise SystemExit(0)

total = sum(m["bytes"] for m in manifest)
items = len({m["item"] for m in manifest})
waiting = len({m["item"] for m in manifest if m["status"] != "approved"})
print(f"{len(manifest)} takes of {items} items, {total / 1024:.0f} KB, into {OUT}")
print(f"{waiting} item(s) not approved yet" if waiting else "every item is approved")
