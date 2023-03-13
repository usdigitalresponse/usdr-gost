# Testing

- [Testing](#testing)
  - [Background](#background)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
  - [Server](#server)
    - [Background - Server](#background---server)
    - [Available Tests](#available-tests)
    - [Running Server Tests - Docker](#running-server-tests---docker)
    - [Running Server Tests - Local](#running-server-tests---local)
  - [Client](#client)
    - [Background - Client](#background---client)

## Background

### Unit Tests

We expect all pull requests to have associated unit tests.

We make use the following technologies for creating them:

- [Mocha](https://mochajs.org/) - test runner
- [Chai](https://www.chaijs.com/) - assertion library
- [Sinon](https://sinonjs.org/) - mocking library

### Integration Tests

As of Mar 12, 2023, we are in the process of adding integration tests to the project. These will be written using [Cypress](https://www.cypress.io/).

## Server

### Background - Server

Server-side tests live in [../packages/server/__tests__](../packages/server/__tests__).

### Available Tests

There are various commands available in [../packages/server/package.json](../packages/server/package.json) to run certain subsets of tests, including:

- `test` - runs all tests
- `test:db` - runs database tests
- `test:apis` - runs API tests
- `test:email` - runs email tests
- `test:arpa` - runs ARPA-specific tests
- `test:agencyimport` - runs agency import tests
- `test:userimport` - runs user import tests

### Running Server Tests - Docker

You can run tests in Docker by prefixing the above with `docker compose exec app`. For example:

```sh
docker compose exec app yarn test:server
docker compose exec app yarn workspace server test:arpa
```

### Running Server Tests - Local

To run tests locally, you can use the following commands:

```sh
cd packages/server
yarn test # runs all tests
yarn test:db # runs database tests
```

Alternatively, from the top-level directory, you can run:

```sh
yarn test:server 
```

or

```sh
yarn workspace server test:db
#etc.
```

## Client

Client-side tests are not as well developed as server-side tests. Work is actively being pursued in this area.

### Background - Client

Client-side tests live in [../packages/client/tests](../packages/client/src/__tests__).

These make use of (the now-in-maintenance-mode) [vue-cli-service](https://cli.vuejs.org/), as well as the `@vue/cli-plugin-unit-mocha` plugin to run Mocha tests.

The current tests are mostly tests of the state in the [Vuex](https://vuex.vuejs.org/) store.

```sh
> yarn test
...
> yarn test:e2e
```
