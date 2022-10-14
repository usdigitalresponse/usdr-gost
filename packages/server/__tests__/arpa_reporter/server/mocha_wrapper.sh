#!/bin/bash

set -o errexit

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Import .env variables if not already defined.
if [[ $DIR =~ "__tests__/arpa_reporter" ]]
then
  # in GOST, mocha_wrapper.sh will be located in packages/server/__tests__/arpa_reporter/server
  # and .env inside packages/server
  DOTENV="$DIR/../../../.env"
else
  # in legacy ARPA Reporter repo, mocha_wrapper.sh is located in tests/server and .env at repo root
  DOTENV="$DIR/../../.env"
fi

source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^([^=]+)=(.*)|: ${\1=\2}; export \1|g')
DONE

# note: this is the DB name of the non-test db, used in reset-db.sh to check if
# dev and test DBs are the same
export DEVDBNAME="${POSTGRES_URL##*/}"

# Legacy for devs w/o POSTGRES_TEST_URL set explicitly in .env
if [[ -z $POSTGRES_TEST_URL ]]
then
  export POSTGRES_TEST_URL="${POSTGRES_URL}_test"
fi

# reset-db.sh and knex within mocha only aware of a single DB URL
export POSTGRES_URL=$POSTGRES_TEST_URL

export DATA_DIR=`dirname $0`/mocha_uploads

$DIR/reset-db.sh

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js "$DIR"'/**/*.spec.js'
fi


# NOTE: This file was copied from tests/server/mocha_wrapper.sh (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
