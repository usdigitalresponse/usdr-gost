# Setup - Mac

- [Setup - Mac](#setup---mac)
  - [Prerequisites](#prerequisites)
    - [Node](#node)
      - [Node Version Manager (NVM) / Nodenv](#node-version-manager-nvm--nodenv)
      - [ASDF](#asdf)
    - [Gmail Setup](#gmail-setup)
  - [Installation](#installation)

These steps are for an install on a Mac. The Windows instructions are [here](./setup-windows.md).

## Prerequisites

### Node

First check the [`.nvmrc` file](./.nvmrc) to make sure you have the correct version of Node.js installed. You can install it using several tools - NVM, Nodenv, or ASDF

#### Node Version Manager (NVM) / Nodenv

To use [NVM](https://nvm.sh/), follow the install directions at <https://github.com/nvm-sh/nvm#install--update-script>. Once installed, you can run `nvm install` to install the correct version of Node.js.

You can manually specify a version with

```sh
nvm install v16.14.0
nvm use v16.14.0
```

If using [Nodenv](https://github.com/nodenv/nodenv) follow the instructions [here](https://github.com/nodenv/nodenv#installation) to install, then run run `nodenv install`.

***Make sure to use new terminals after completing install***

#### ASDF

Install ASDF using the instructions [here](https://asdf-vm.com/guide/getting-started.html), then:

```sh
   asdf plugin add nodejs
   asdf install nodejs 16.14.0
   asdf local nodejs 16.14.0
```

### Gmail Setup

See [./setup-email.md](./setup-email.md) for instructions on setting up Gmail to send emails.

## Installation

1. Install dependencies

    The scripts will install yarn and download npm dependencies for all yarn workspaces.

    ```sh
        cd usdr-gost/
        npm i yarn@^1.22.4 -g
        yarn run setup
    ```

1. Create database(s)

   Install postgres DB. I personally used <https://postgresapp.com/>

   ```sh
   psql -h localhost -p 5432
   CREATE DATABASE usdr_grants;
   CREATE DATABASE usdr_grants_test;
   ```

1. Setup ENVs

   Copy packages/client & packages/server `.env.example` to `.env`

   ```sh
   cp packages/client/.env.example packages/client/.env
   cp packages/server/.env.example packages/server/.env
   ```

   ***Note:*** In order to login, the server must be able to send email. Set the relevant environment variables under `# Email Server:` in `server/.env` to credentials for a personal email account (e.g. for Gmail, see [Getting Startd], with more info [here](https://support.google.com/mail/answer/7126229)) from Google.

1. Setup Gmail
   (See [GMail setup instructions](./setup-gmail.md) for info on setting up gmail to send emails. You will need to set this up in order to log into the app!

1. Run DB Migrations & Seed

   In server workspace, run migrations and seeds:

   ```sh
   cd packages/server
   export $(cat .env) #delete all comment lines in .env file
   yarn db:migrate
   yarn db:seed
   ```

   or, from the top-level directory:

    ```sh
    yarn workspace server run db:seed
    ```
