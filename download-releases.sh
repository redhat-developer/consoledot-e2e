#! /bin/bash
set -euxo pipefail

GH_TOKEN=$1
if [ -z "$GH_TOKEN" ]; then
    echo "Please provide a GH TOKEN as first argument."
    exit 1
fi

INITIAL_TAG=${INITIAL_TAG:-'1'}
REPO='redhat-developer/consoledot-e2e'

curl -sL https://api.github.com/repos/${REPO}/releases | jq -rc '.[].name' | \
  while IFS='' read tag; do
    echo "Downloading test results for ID ${tag}"
    curl -f -sL https://github.com/${REPO}/releases/download/${tag}/results.xml -o test-results/results-${tag}.xml

    # do business with the downloaded file

    curl \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      -X DELETE "https://api.github.com/repos/${REPO}/git/refs/${tag}"

    curl \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      -X DELETE "https://api.github.com/${REPO}/releases/${tag}"
  done
