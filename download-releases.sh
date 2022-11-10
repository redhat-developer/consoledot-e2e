#! /bin/bash
# set -x

INITIAL_TAG=${INITIAL_TAG:-'1'}
REPO='andreaTP/consoledot-e2e'
LATEST_TAG=$(curl -sL "https://api.github.com/repos/${REPO}/releases/latest" | jq -r '.tag_name')

echo "Latest release is ${LATEST_TAG}"

for (( i = ${INITIAL_TAG}; i <= ${LATEST_TAG}; i++ )) do
  # echo "Downloading test results for ID $i"
  curl -f -sL https://github.com/${REPO}/releases/download/${i}/results.xml -o test-results/results-${i}.xml &
done
