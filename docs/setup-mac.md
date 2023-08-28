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

See [./setup-gmail.md](./setup-gmail.md) for instructions on setting up Gmail to send emails.

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

## Datadog

It's possible to send tracing data from your local development instance to datadog.  To do so, you will need to:

1. Install a [Datadog Agent](https://docs.datadoghq.com/getting_started/agent/) locally and give it credentials to send data to the USDR datadog instance.
1. Configure the datadog tracing library with environment variables

### Install the Datadog Agent

Datadog provides agent installation instructions within the [datadog.hq app](https://app.datadoghq.com/account/settings/agent/latest?_gl=1%2Ancclch%2A_gcl_aw%2AR0NMLjE2OTI3NDkyNzEuQ2owS0NRand1WkduQmhEMUFSSXNBQ3hiQVZqQS13YTlHVFFORGxQaVlFWDQzb1hiWTdHYzNxTFpScXhQam84UFg3cnRqTHZxT1UxSWdNY2FBbzJRRUFMd193Y0I.%2A_gcl_au%2AMTUyNDczOTE5Mi4xNjkyMjQxMDkw%2A_ga%2AMTQ3MTcxNzMzMy4xNjkzMDIxMDQ2%2A_ga_KN80RDFSQK%2AMTY5MzE5MDg2Mi41LjEuMTY5MzE5MDkxNC4wLjAuMA..%2A_fplc%2ARnhXc1BjdFZjcmF6dFZmSmpJNDlXRDUzeXVpdVdtZWI4eDhnazhvYVdpUkI1dWRESFBwVzN1QnNIRXBDVHllJTJCdVdBZUxpJTJGJTJCWCUyRjNnUWVnQWgycWVSb3IyR2tyeWp6T0pSR01oc2YlMkZHWkN5MWd6RTRXS1lWdU80bnR3JTJGJTJCb2clM0QlM0Q.&platform=macos).

Select (or create) an API key and copy the corresponding install command, which should automatically install and start the agent.

### Configure tracing library

Next, make sure your local `packages/server/.env` file includes the recommended datadog environment variables (specified in `packages/server/.env.example`).

### Query traces from datadoghq.com

Now you should be able to start your development service normally. If your environment is set correctly, the dd-trace library should print startup logs confirming the configuration you have specified.

Finally, tracing data should now be available on datadog.  You can filter for your local traces by specifying the `env:sandbox` tag in your trace query.
