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
# From the release's checksums.txt; update together with VERSION.
case "${OS}_${ARCH}" in
	darwin_amd64) SHA256=052906521f09f6f23405cd804c930d2b7a1f8eee06d39b85723b5054b2acb4e4 ;;
	darwin_arm64) SHA256=eeb619ea4f8a06421daedb946d133bed269fea334a760941d147f76befc25ebc ;;
	linux_amd64) SHA256=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa ;;
	linux_arm64) SHA256=86095bf8ed9345954f0d2bf0a5fb9b57584ae60b77ebf3b6cd23a8003a3fd418 ;;
	*) echo "no checksum for ${OS}_${ARCH}" >&2; exit 1 ;;
esac
TMP=$(mktemp -d)
curl -fsSL -o "$TMP/pb.zip" "https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${OS}_${ARCH}.zip"
if command -v sha256sum >/dev/null; then SUM=sha256sum; else SUM="shasum -a 256"; fi
echo "$SHA256  $TMP/pb.zip" | $SUM -c - >/dev/null || { echo "checksum mismatch for pocketbase ${VERSION}" >&2; exit 1; }
mkdir -p pb
unzip -o -q "$TMP/pb.zip" pocketbase -d pb
rm -rf "$TMP"
echo "pb/pocketbase $VERSION ready"
