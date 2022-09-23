#!/bin/bash

set -o errexit

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [[ -e $DIR/arpa_reporter ]]
then
  NODE_ENV=test $DIR/arpa_reporter/server/mocha_wrapper.sh
else
  echo "Skipping ARPA Reporter tests because directory does not exist"
fi
