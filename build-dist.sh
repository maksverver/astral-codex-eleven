#!/bin/sh

set -e -E -o pipefail

version=$(sed -ne 's/^ *"version": "\([0-9.]*\)", *$/\1/p' extension/manifest.json)
if [ -z "$version" ]; then
  echo "Failed to get extension version from manifest!" 2>&1
  exit 1
fi

output=astral-codex-eleven-${version}.zip

rm -f "${output}"

(cd extension && zip -9 ../"${output}" *.* images/*)
zip -9 "${output}" LICENSE.txt
