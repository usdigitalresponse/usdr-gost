# Using Docker for Development

You can use Docker to run the database, API server, and Vue frontend during development,
which should help ensure consistent development environments and avoid workstation
clutter. The easiest way to install Docker is their [Desktop Applications](https://www.docker.com/products/docker-desktop/),
which can be installed via their GUI installers or your systems package manager.


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
4. Run `docker compose up -d` to start the services in the background (the `-d` flag).
5. Install application dependencies via yarn: `docker compose exec app yarn`.
6. Visit http://localhost:8080 to confirm you see 'Grants Identification Tool' with a prompt to enter an email address.
If you see a blank screen, [review the logs](#cookbook-logs), you may need to [run a db migrate](#cookbook-db-migrate) and restart the app container.


**Note:** Some systems may have Docker Compose installed as an integrated plugin for Docker,
while others may have it installed as a standalone executable (e.g. via `pip install`).
The example commands in this documentation assume the plugin is installed and is invoked
via `docker compose <subcommand>` in your command-line environment, but your system may require
that you invoke it by running `docker-compose <subcommand>`.


## Development Cookbook

Refer to this section for common scenarios and their solutions when using Docker
for development.

### Install or update dependencies

After your intitial setup or for any update to the `package.json` file that
tracks application dependencies, you'll need to run yarn. This
can be executed via `exec`. For example, to install dependencies after initial
setup: `docker compose exec app yarn`.

For more on how dependencies are managed in the application see the documentation
on how we use [Workspaces](../docs/workspaces.md).

### Seed and apply migrations to the database <a name="cookbook-db-migrate"></a>

- To apply database migrations, run: `docker compose exec app yarn db:migrate`
- To seed the database, run: `docker compose exec app yarn db:seed`

For a first time run, the app may need to be restarted in order to pick up a migrate, run: `docker compose restart app`

### Working with logs <a name="cookbook-logs"></a>

You may want to retrieve logs from all of the services (eg app, db, frontend)
and that can be accomplished with:

```
$ docker compose logs
```

You can also target specific services to just see logs, for example, just the
backend app, and add `-f` to tail the logs:

```
$ docker compose logs -f app
```

You can see all the services available in [docker-compose.yml](../docker-compose.yml).

### Recreating the environment

A common trouble-shooting technique if you've changed configuration, are encountering
an unknown error, or so on, is to just destroy and re-create the environment:

```
$ docker compose down
```

```
$ docker compose up -d
```

Note: The `-d` flag here instructs Docker compose to run the services in the
background, and is recommended. Otherwise, if you exit your shell session it will
stop the running services.


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


### Create SQS queues in localstack
SQS queues should automatically be setup from the `localstack/entrypoint/init-aws.sh` script.
This script gets run by localstack after the container is setup.

To confirm evreything is working well, run the following locally (you may need the `aws cli` locally)
```
aws --region us-west-2 --endpoint http://localhost:4566 sqs list-queues
```

If the queue is not setup, first check that you have an updated version of localstack.

If you have an updated version, but still need to setup the queuse, run the below commands.
```
docker ps
# assuming the localstack container name is gost-localstack_main
docker exec -it gost-localstack_main /bin/bash
bash-5.0# awslocal sqs --queue-name arpa-queue
bash-5.0# awslocal sqs list-queues
```
Now we can use that queue name and set it as the environment variable `ARPA_AUDIT_REPORT_SQS_QUEUE_URL`.

To confirm that you can access the queues locally, use the `aws cli` again
```
aws --region us-west-2 --endpoint http://localhost:4566 sqs list-queues
```
For this to work, you must have `AWS_ACCESS_KEY_ID=test` and `AWS_SECRET_ACCESS_KEY=test`.
This is part of the standard localstack setup.

