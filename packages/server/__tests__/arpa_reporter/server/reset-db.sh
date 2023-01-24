#!/bin/bash

set -o pipefail
set -o errexit
set -o nounset

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "DIR IS $DIR";

dbconn=${POSTGRES_URL#*//}  # from postgres://user:pass@host/dbname -> user:pass@host/dbname
userpass=${dbconn%@*}       # 'user:pass'
hostdbname=${dbconn#*@}         # host/dbname
if [ $userpass == $hostdbname ]
then
  userpass='postgres'
fi

username=${userpass%:*}
password=${userpass#*:}

host=${hostdbname%/*}
dbname=${hostdbname#*/}

hostname=${host%:*}
hostport=${host#*:}
if [ $hostport == $hostname ]
then
  hostport="5432"
fi

echo Using database $dbname

mkdir -p $DATA_DIR
rm -rf $DATA_DIR/*

# In CI, POSTGRES_URL and POSTGRES_TEST_URL are the same: there is only a single database. In that
# environment, we avoid dropping the DB itself and instead drop the "public" schema within it.
set -x
if [ $DEVDBNAME == $dbname ]
then
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "DROP SCHEMA public CASCADE"
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "CREATE SCHEMA public"
else
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "DROP DATABASE IF EXISTS $dbname"
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "CREATE DATABASE $dbname"
fi

yarn knex migrate:latest
yarn knex --knexfile "$DIR"/knexfile.js seed:run

# NOTE: This file was copied from tests/server/reset-db.sh (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
