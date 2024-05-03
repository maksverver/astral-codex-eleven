#!/bin/sh

set -e -E -o pipefail

version=$(sed -ne 's/^ *"version": "\([0-9.]*\)", *$/\1/p' extension/manifest.json)
if [ -z "$version" ]; then
  echo "Failed to get extension version from manifest!" 2>&1
  exit 1
fi

output=astral-codex-eleven-${version}.zip
echo "Creating ${output}"
rm -f -- "${output}"
(cd extension && zip -9 ../"${output}" *.* images/*)
zip -9 "${output}" LICENSE.txt

# The Firefox add-on needs to include an add-on id in manifest.json, so I create
# a separate zip file just for Firefox here, with a patched manifest. See:
# https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/
output_firefox=astral-codex-eleven-${version}-firefox.zip
echo "Creating ${output_firefox}"
cp -- "${output}" "${output_firefox}"
patch extension/manifest.json firefox-manifest.patch  # patch the manifest
(cd extension && zip -9 ../"${output_firefox}" manifest.json)
patch -R extension/manifest.json firefox-manifest.patch  # undo patch
