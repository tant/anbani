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
