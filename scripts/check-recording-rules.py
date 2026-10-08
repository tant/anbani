"""Proves the recording rules on a running PocketBase by calling the API as each kind of caller.

A rule expression that reads correctly can still be wrong, so this creates real rows and real audio
and checks who is allowed to do what. Recording is open and anonymous; the audio is not. Point it at
a throwaway instance, and keep --automigrate=0 so a test cannot write migrations into the repo:

    ./pb/pocketbase superuser upsert root@test.local testpass12345 --dir /tmp/pbcheck
    ./pb/pocketbase serve --dir /tmp/pbcheck --migrationsDir pb/pb_migrations --automigrate=0 \\
      --http 127.0.0.1:8093 &
    PB_URL=http://127.0.0.1:8093 PB_SUPERUSER_EMAIL=root@test.local \\
      PB_SUPERUSER_PASSWORD=testpass12345 python3 scripts/check-recording-rules.py
"""

import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("PB_URL", "http://127.0.0.1:8093").rstrip("/")
fails = []


def call(path, payload=None, method="GET", token=None, files=0, raw=False):
    headers = {}
    if token:
        headers["Authorization"] = token
    data = None
    if files:
        boundary = uuid.uuid4().hex
        parts = []
        for key, value in (payload or {}).items():
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
        for i in range(files):
            parts.append(
                f'--{boundary}\r\nContent-Disposition: form-data; name="audio"; filename="take{i}.webm"\r\n'
                f"Content-Type: audio/webm\r\n\r\n".encode() + AUDIO + b"\r\n"
            )
        parts.append(f"--{boundary}--\r\n".encode())
        data = b"".join(parts)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
            if raw:
                return r.status, body
            return r.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, (body if raw else json.loads(body or b"{}"))


def check(name, got, want):
    ok = got == want
    print(("PASS " if ok else "FAIL ") + f"{name}: {got} (want {want})")
    if not ok:
        fails.append(name)


def silence():
    """A real Opus file, so the upload passes the field's media-type check."""
    out = os.path.join(tempfile.mkdtemp(), "take.webm")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.6:sample_rate=16000",
         "-ac", "1", "-c:a", "libopus", "-b:a", "24k", "-f", "webm", out, "-y"],
        check=True,
    )
    return open(out, "rb").read()


def superuser_token():
    st, out = call(
        "/api/collections/_superusers/auth-with-password",
        {"identity": os.environ["PB_SUPERUSER_EMAIL"], "password": os.environ["PB_SUPERUSER_PASSWORD"]},
        "POST",
    )
    assert st == 200, out
    return out["token"]


AUDIO = silence()
SUPER = superuser_token()
tag = uuid.uuid4().hex[:6]

# Items have to be real catalogue keys; these three stand in for "one item", "another" and "a third".
ITEM, OTHER, THIRD = "letter:ა", "word:water", "phrase:hello"


def account(email, role):
    st, _ = call("/api/collections/users/records",
                 {"email": email, "password": "passw0rd1234", "passwordConfirm": "passw0rd1234", "role": role},
                 "POST", SUPER)
    assert st == 200
    st, auth = call("/api/collections/users/auth-with-password", {"identity": email, "password": "passw0rd1234"}, "POST")
    assert st == 200, auth
    return auth["record"]["id"], auth["token"]


owner_id, owner_tok = account(f"owner-{tag}@test.local", "owner")
learner_id, learner_tok = account(f"learner-{tag}@test.local", "")


def file_token(token):
    st, out = call("/api/files/token", {}, "POST", token)
    return out.get("token") if st == 200 else None


def reach(row, name, token=None):
    url = f"/api/files/{row['collectionId']}/{row['id']}/{name}"
    if token:
        url += "?token=" + token
    return call(url, None, "GET", None, raw=True)[0]


# Recording needs no account at all.
st, row = call("/api/collections/recordings/records", {"item": ITEM, "status": "pending"}, "POST", None, files=3)
check("anyone can record, with no account", st, 200)
check("all three takes are stored", len(row.get("audio", [])), 3)

st, _ = call("/api/collections/recordings/records", {"item": OTHER, "status": "approved"}, "POST", None, files=3)
check("a recording cannot arrive already reviewed", st, 400)

st, _ = call("/api/collections/recordings/records", {"item": ITEM, "status": "pending"}, "POST", None, files=3)
check("one row per item", st, 400)

# Together these two bound what an open endpoint can ever store: 85 items x 3 takes x 128 KB.
st, _ = call("/api/collections/recordings/records", {"item": "not-in-the-catalogue", "status": "pending"}, "POST", None, files=3)
check("an item outside the catalogue is refused", st, 400)
st, col = call("/api/collections/recordings", None, "GET", SUPER)
audio = [f for f in col["fields"] if f["name"] == "audio"][0]
item = [f for f in col["fields"] if f["name"] == "item"][0]
check("the item is a fixed list, not free text", item["type"], "select")
check("a take is capped at 128 KB", audio["maxSize"], 131072)
check("three takes at most", audio["maxSelect"], 3)

# The screen has to know what is done; the audio stays shut.
st, listed = call("/api/collections/recordings/records?perPage=200")
check("the list is open, so the screen knows what is recorded", any(r["item"] == ITEM for r in listed["items"]), True)
check("the list says nothing about who recorded it", "reader" in listed["items"][0], False)

check("one row cannot be read without an account", call(f"/api/collections/recordings/records/{row['id']}")[0], 404)
check("nor by an ordinary account", call(f"/api/collections/recordings/records/{row['id']}", None, "GET", learner_tok)[0], 404)
check("the owner reads it", call(f"/api/collections/recordings/records/{row['id']}", None, "GET", owner_tok)[0], 200)

check("a file token needs an account", file_token(None), None)
check("the audio does not open on its address alone", reach(row, row["audio"][0]), 404)
check("nor for an ordinary account holding a token", reach(row, row["audio"][0], file_token(learner_tok)), 404)
check("the owner reaches the audio with a file token", reach(row, row["audio"][0], file_token(owner_tok)), 200)

# A misread item can be recorded again: drop the row, record it once more.
check("an unreviewed row can be dropped so a redo can replace it", call(f"/api/collections/recordings/records/{row['id']}", None, "DELETE")[0], 204)
st, row = call("/api/collections/recordings/records", {"item": ITEM, "status": "pending"}, "POST", None, files=3)
check("and recorded again in its place", st, 200)

# Reviewing is nobody's job but the owner's, and it is still gated on three takes.
check("an ordinary account cannot review", call(f"/api/collections/recordings/records/{row['id']}", {"status": "approved"}, "PATCH", learner_tok)[0], 404)
st, short = call("/api/collections/recordings/records", {"item": THIRD, "status": "pending"}, "POST", None, files=2)
check("a short item is stored", st, 200)
check("but cannot be approved", call(f"/api/collections/recordings/records/{short['id']}", {"status": "approved"}, "PATCH", owner_tok)[0], 404)
check("a full item can", call(f"/api/collections/recordings/records/{row['id']}", {"status": "approved"}, "PATCH", owner_tok)[0], 200)
check("and once approved it can no longer be dropped", call(f"/api/collections/recordings/records/{row['id']}", None, "DELETE")[0], 404)

# A role is handed out by a superuser only, at sign-up as much as afterwards.
st, _ = call("/api/collections/users/records",
             {"email": f"sneak-{tag}@test.local", "password": "passw0rd1234", "passwordConfirm": "passw0rd1234", "role": "owner"},
             "POST")
check("signing up cannot ask for a role", st, 400)
st, _ = call("/api/collections/users/records",
             {"email": f"plain-{tag}@test.local", "password": "passw0rd1234", "passwordConfirm": "passw0rd1234"}, "POST")
check("an ordinary sign-up still works", st, 200)
check("an account cannot grant itself a role", call(f"/api/collections/users/records/{learner_id}", {"role": "owner"}, "PATCH", learner_tok)[0], 404)
check("but still edits its own settings", call(f"/api/collections/users/records/{learner_id}", {"lang": "en"}, "PATCH", learner_tok)[0], 200)

# Nothing in the request log should point back at whoever recorded.
st, settings = call("/api/settings", None, "GET", SUPER)
check("the request log keeps no IP address", settings["logs"]["logIP"], False)

print()
print("FAILED: " + ", ".join(fails) if fails else "all checks passed")
sys.exit(1 if fails else 0)
