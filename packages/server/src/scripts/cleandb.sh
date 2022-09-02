#!/bin/bash

# Load .env file if present
set -a; source .env; set +a
# abort on exception
set =e

# Get DB name from connection URI
dbname=${POSTGRES_URL#*//*/}
# Remove DB name from connection URI
postgres_url=${POSTGRES_URL/$dbname}

echo $dbname

psql $postgres_url -c "DROP DATABASE IF EXISTS $dbname"
psql $postgres_url -c "CREATE DATABASE $dbname"

# NOTE: This file was copied from scripts/cleandb.sh (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
