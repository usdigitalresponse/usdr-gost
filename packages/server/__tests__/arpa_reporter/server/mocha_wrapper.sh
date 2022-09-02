#!/bin/bash

set -o errexit

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Import .env variables if not already defined.
DOTENV="$DIR/../../.env"
source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
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
  mocha --require=`dirname $0`/mocha_init.js 'tests/server/**/*.spec.js'
fi


# NOTE: This file was copied from tests/server/mocha_wrapper.sh (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
