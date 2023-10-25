#!/bin/bash

# Enable error checking
set -e

# See whether there's a standalone docker-compose binary
command_path=$(which docker-compose)

if [ -z "$command_path" ]; then
  command_path="docker compose"
fi

# Create .env files if they don't exist
if [ ! -f "packages/server/.env" ]; then
  echo "Creating packages/server/.env for app environment"
  cp packages/server/.env.example packages/server/.env
fi

if [ ! -f "packages/client/.env" ]; then
  echo "Creating packages/client/.env for frontend environment"
  cp packages/client/.env.example packages/client/.env
fi

$command_path up -d
