FROM node:16.14.0-alpine as app_base
WORKDIR /app
COPY . .
RUN ["mkdir", "-p", "/root/.config/yarn"]
RUN ["chmod", "-R", "777", "/root"]
RUN ["apk", "--update", "add", "bash"]
RUN ["yarn", "run", "setup"]

FROM app_base as client
CMD ["yarn", "start:client"]

FROM app_base as api
RUN ["apk", "--update", "add", "postgresql-client"]
WORKDIR /app/packages/server
RUN ["yarn", "install"]
WORKDIR /app
CMD ["yarn", "start:server"]

FROM cypress/base:16.14.0 as e2e
WORKDIR /app

# dependencies will be installed only if the package files change
COPY ./packages/e2e/package.json .
COPY ./yarn.lock .

# by setting CI environment variable we switch the Cypress install messages
# to small "started / finished" and avoid 1000s of lines of progress messages
# https://github.com/cypress-io/cypress/issues/1243
ENV CI=1
ENV CYPRESS_BASE_URL=http://frontend:8080
RUN ["yarn", "install", "--frozen-lockfile"]

# verify that Cypress has been installed correctly.
# running this command separately from "cypress run" will also cache its result
# to avoid verifying again when running the tests
RUN ["npx", "cypress", "verify"]
CMD ["npx", "cypress", "run"]
