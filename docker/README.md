# Using Docker for Development

You can use Docker to run the database, API server, and Vue frontend during development,
which should help ensure consistent development environments and avoid workstation clutter.


## Setup

With Docker and Docker Compose installed on your workstation, complete the following
steps to prepare your environment:

1. If you have not already done so, copy the file at `packages/server/.env.example`
  to `packages/server/.env`, and copy the file at `packages/client/.env.example`
  to `packages/client/.env`
2. Set the following environment variables in `packages/server/.env` accordingly:
  - `POSTGRES_URL=postgresql://postgres:password123@postgres:5432/usdr_grants`
  - `POSTGRES_TEST_URL=postgresql://postgres:password123@postgres:5432/usdr_grants_test`
  - You may also have to set the `WEBSITE_DOMAIN` hostname if you are not developing on `localhost`
  ([more info](#cookbook-non-localhost)).
3. Run `docker compose up -d` to start the services.


**Note:** Some systems may have Docker Compose installed as an integrated plugin for Docker,
while others may have it installed as a standalone executable (e.g. via `pip install`).
The example commands in this documentation assume the plugin is installed and is invoked
via `docker compose <subcommand>` in your command-line environment, but your system may require
that you invoke it by running `docker-compose <subcommand>`.


## Development Cookbook

Refer to this section for common scenarios and their solutions when using Docker
for development.


### Seed and apply migrations to the database

- To apply database migrations, run: `docker compose exec app yarn db:migrate`
- To seed the database, run: `docker compose exec app yarn db:seed`


### Run tests

To execute a test suite, use `docker compose exec` to run the test command in the container.
A few examples:

```shell
# Run all test suites for both the client and the server
> docker compose exec app yarn test

# Run all test suites for the server
> docker compose exec app yarn test:server

# Run just the "apis" test suite for the server
> docker compose exec --workdir /app/packages/server app yarn test:apis
```

Note: The above examples will execute in the `app` container.


### Access an interactive shell within a docker container

You can shell into a running container's linux environment by running
`docker compose exec <service> bash`, where `service` is one of the service names defined
in `docker-compose.yml` (e.g. `app`, `frontend`, or `postgres`). This is akin to accessing
a remote host using SSH.

To end the interactive session, use the commmand, `exit`.


### Docker runs on something other than `localhost`<a name="cookbook-non-localhost"></a>

When the client and server containers run on a remote machine, the remote hostname must be
specified by setting the appropriate environment variables in the container runtime.
The easiest way to do this is to set the appropriate variables in the respective `.env` file:

- In `packages/server/.env`: add `WEBSITE_DOMAIN=http://<remote-hostname>:8080`
- In `packages/client/.env`: add either `VUE_ALLOWED_HOSTS=all` *or*
  `VUE_ALLOWED_HOSTS=<remote-hostname>`

Hint: In the above examples, remember to substitute `<remote-hostname>` for the actual hostname
that applies to your development environment.


### Customize Postgres databases or container environment at startup

The Postgres container environment can be customized by placing scripts in dedicated mounted
volumes before the container is executed.

- `docker/postgres/docker-entrypoint-preinitdb.d`: Any files with a `.sh` extension
  placed in this directory will be executed within the container *before* postgresql
  is initialized or started. Therefore, you can use these scripts to customize configuration
  of the containerized environment.
- `docker/postgres/docker-entrypoint-initdb.d`: Any files with `.sh`, `.sql`, or `.sql.gz`
  extensions placed in this directory will be executed when the container is started for the first
  time. You can use these scripts to automatically create postgresql databases, users, and other
  resources.

For more information, see the "Configuration" section of the `bitnami/postgresql` Docker image
documentation: https://hub.docker.com/r/bitnami/postgresql


### Persist data across postgres containers

By default, postgres container databases and their data will be lost when the container
is removed/rebuilt, which helps ensure a clean and consistent database state in newly-created
development environments (e.g. you can nuke everything and start fresh). However, if you would
like to persist the state of your databases across rebuilds, you can mount a local directory
from your workstation at the `/bitnami/postgresql` path within the container. For your convenience,
this repository contains a directory at `docker/postgres/persistence` to use for this purpose;
any files within this directory will be ignored by git. Simply update the `postgres` service
definition in the `docker-compose.yml` file to mount this volume – you can do so
by adding/uncommenting the corresponding `services.postgres.volumes` item in that file so that
the `./docker/postgres/persistence:/bitnami/postgresql` volume mount is enabled.
