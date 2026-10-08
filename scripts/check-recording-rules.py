"""Proves the recording rules on a running PocketBase by calling the API as each role.

A rule expression that reads correctly can still be wrong, so this creates real users, real rows and
real audio, then checks who is allowed to do what. Point it at a throwaway instance:

    ./pb/pocketbase superuser upsert root@test.local testpass12345 --dir /tmp/pbcheck
    ./pb/pocketbase serve --dir /tmp/pbcheck --migrationsDir pb/pb_migrations --http 127.0.0.1:8093 &
    PB_URL=http://127.0.0.1:8093 PB_SUPERUSER_EMAIL=root@test.local \
      PB_SUPERUSER_PASSWORD=testpass12345 python3 scripts/check-recording-rules.py
"""

import json, os, subprocess, sys, tempfile, urllib.error, urllib.request, uuid

BASE = os.environ.get("PB_URL", "http://127.0.0.1:8093").rstrip("/")
fails = []


def superuser_token():
    req = urllib.request.Request(
        BASE + "/api/collections/_superusers/auth-with-password",
        data=json.dumps({"identity": os.environ["PB_SUPERUSER_EMAIL"], "password": os.environ["PB_SUPERUSER_PASSWORD"]}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)["token"]


def silence():
    """A real Opus file, so the upload passes the field's media-type check."""
    out = os.path.join(tempfile.mkdtemp(), "take.webm")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.6:sample_rate=16000",
         "-ac", "1", "-c:a", "libopus", "-b:a", "24k", "-f", "webm", out, "-y"],
        check=True,
    )
    return open(out, "rb").read()


SUPER = superuser_token()
AUDIO = silence()


def call(path, payload=None, method="GET", token=None, files=0):
    headers = {}
    if token:
        headers["Authorization"] = token
    data = None
    if files:
        b = uuid.uuid4().hex
        parts = []
        for k, v in (payload or {}).items():
            parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        for i in range(files):
            parts.append(
                f'--{b}\r\nContent-Disposition: form-data; name="audio"; filename="take{i}.webm"\r\n'
                f"Content-Type: audio/webm\r\n\r\n".encode() + AUDIO + b"\r\n"
            )
        parts.append(f"--{b}--\r\n".encode())
        data = b"".join(parts)
        headers["Content-Type"] = f"multipart/form-data; boundary={b}"
    elif payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
            return r.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def check(name, got, want):
    ok = got == want
    print(("PASS " if ok else "FAIL ") + f"{name}: {got} (want {want})")
    if not ok:
        fails.append(name)


def mkuser(email, role):
    st, u = call("/api/collections/users/records", {"email": email, "password": "passw0rd1234", "passwordConfirm": "passw0rd1234", "role": role}, "POST", SUPER)
    assert st == 200, (st, u)
    st, a = call("/api/collections/users/auth-with-password", {"identity": email, "password": "passw0rd1234"}, "POST")
    assert st == 200, (st, a)
    return u["id"], a["token"]


tag = uuid.uuid4().hex[:6]
reader_id, reader_tok = mkuser(f"reader-{tag}@test.local", "reader")
owner_id, owner_tok = mkuser(f"owner-{tag}@test.local", "owner")
learner_id, learner_tok = mkuser(f"learner-{tag}@test.local", "")

# a learner cannot record
st, _ = call("/api/collections/recordings/records", {"item": f"letter:a-{tag}", "status": "pending", "reader": learner_id}, "POST", learner_tok, files=3)
check("learner cannot create", st, 400)  # a blocked create reads as a bad request

# a reader cannot publish their own work
st, _ = call("/api/collections/recordings/records", {"item": f"letter:b-{tag}", "status": "approved", "reader": reader_id}, "POST", reader_tok, files=3)
check("reader cannot create approved", st, 400)

# a reader cannot file a recording under someone else
st, _ = call("/api/collections/recordings/records", {"item": f"letter:c-{tag}", "status": "pending", "reader": owner_id}, "POST", reader_tok, files=3)
check("reader cannot create for another", st, 400)

# the normal path: three takes in one go
st, full = call("/api/collections/recordings/records", {"item": f"letter:d-{tag}", "status": "pending", "reader": reader_id}, "POST", reader_tok, files=3)
check("reader creates three takes", st, 200)
check("three files stored", len(full.get("audio", [])), 3)

# a short item is accepted but must not be publishable
st, short = call("/api/collections/recordings/records", {"item": f"letter:e-{tag}", "status": "pending", "reader": reader_id}, "POST", reader_tok, files=2)
check("reader creates two takes", st, 200)
st, _ = call(f"/api/collections/recordings/records/{short['id']}", {"status": "approved"}, "PATCH", owner_tok)
check("owner cannot approve two takes", st, 404)  # a row the rule rejects is reported as missing
st, _ = call(f"/api/collections/recordings/records/{short['id']}", {"status": "rejected", "note": "again please"}, "PATCH", owner_tok)
check("owner can reject two takes", st, 200)

# the reader cannot review, but can withdraw their own unapproved work
st, _ = call(f"/api/collections/recordings/records/{full['id']}", {"status": "approved"}, "PATCH", reader_tok)
check("reader cannot update", st, 404)
st, _ = call(f"/api/collections/recordings/records/{short['id']}", None, "DELETE", reader_tok)
check("reader deletes own rejected row", st, 204)

st, _ = call(f"/api/collections/recordings/records/{full['id']}", {"status": "approved"}, "PATCH", owner_tok)
check("owner approves three takes", st, 200)

# what each audience sees
st, anon = call("/api/collections/recordings/records?perPage=200")
check("anonymous sees only approved", sorted({r["status"] for r in anon["items"]}), ["approved"])
st, lrn = call("/api/collections/recordings/records?perPage=200", None, "GET", learner_tok)
check("learner sees only approved", sorted({r["status"] for r in lrn["items"]}), ["approved"])

st, pend = call("/api/collections/recordings/records", {"item": f"letter:f-{tag}", "status": "pending", "reader": reader_id}, "POST", reader_tok, files=3)
st, _ = call(f"/api/collections/recordings/records/{pend['id']}")
check("anonymous cannot read a pending row", st, 404)
st, _ = call(f"/api/collections/recordings/records/{pend['id']}", None, "GET", reader_tok)
check("reader reads own pending row", st, 200)
st, own = call("/api/collections/recordings/records?perPage=200&filter=" + urllib.request.quote('status="pending"'), None, "GET", owner_tok)
check("owner sees pending rows", any(r["id"] == pend["id"] for r in own["items"]), True)

# nobody promotes themselves
st, _ = call(f"/api/collections/users/records/{learner_id}", {"role": "owner"}, "PATCH", learner_tok)
check("learner cannot grant themselves a role", st, 404)
st, _ = call(f"/api/collections/users/records/{learner_id}", {"lang": "en"}, "PATCH", learner_tok)
check("learner still edits own settings", st, 200)

# the reader cannot delete someone else's work either
st, _ = call(f"/api/collections/recordings/records/{pend['id']}", None, "DELETE", learner_tok)
check("learner cannot delete a recording", st, 404)

# a role is handed out by a superuser only, at sign-up as much as afterwards
st, _ = call("/api/collections/users/records", {"email": f"sneak-{tag}@test.local", "password": "passw0rd1234", "passwordConfirm": "passw0rd1234", "role": "owner"}, "POST")
check("signing up cannot ask for a role", st, 400)
st, _ = call("/api/collections/users/records", {"email": f"plain-{tag}@test.local", "password": "passw0rd1234", "passwordConfirm": "passw0rd1234"}, "POST")
check("an ordinary sign-up still works", st, 200)

print()
print("FAILED: " + ", ".join(fails) if fails else "all checks passed")
sys.exit(1 if fails else 0)
