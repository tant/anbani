#!/bin/sh
# Content fingerprint of the build (SDO-301): hashes the files the Docker image
# is made from. The Dockerfile writes the result to pb_public/version.txt; CI runs
# this same script on the pushed source and waits until
# anbani.korbvazi.com/version.txt returns the same value — the only way to know
# the running build is the pushed one, since a broken build leaves the old
# container serving 200.
#
# One script for both sides so there are no two copies of the command to keep
# in sync. Runs on busybox (alpine, at build time) and GNU (CI runner).
# Update the list when the Dockerfile starts copying something new.
set -eu
find src static pb/pb_migrations pb/pb_hooks scripts/get-pocketbase.sh \
  package.json package-lock.json svelte.config.js vite.config.ts tsconfig.json Dockerfile \
  -type f -print0 \
  | LC_ALL=C sort -z | xargs -0 sha256sum | sha256sum | cut -c1-16
