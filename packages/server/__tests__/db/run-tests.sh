#!/bin/bash

# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
set -e
CYAN='\033[0;36m'
NC='\033[0m'

dbname=usdr_grants_test

# echo Using database $dbname with username postgres
# echo -e "\nEnter the password for the ${CYAN}postgres user${NC} on your local pg instance"
# read -s -p "Postgres user password: " pgpass

# connection="postgres://postgres:$pgpass@localhost"
connection="postgresql://localhost:5432"
export POSTGRES_URL="$connection/$dbname"

psql $connection -c "DROP DATABASE IF EXISTS $dbname" -c "CREATE DATABASE $dbname"

yarn knex migrate:latest
yarn knex --knexfile $DIR/knexfile.js seed:run

mocha "$DIR/*.test.js"