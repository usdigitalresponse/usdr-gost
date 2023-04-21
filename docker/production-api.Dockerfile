FROM node:16.14.0-alpine as app_base

# Define build argument defaults
ARG GIT_COMMIT=""
ARG GIT_REF=""
ARG TIMESTAMP=""

# Prepare the environment
RUN ["apk", "--update", "add", "bash", "postgresql-client", "util-linux"]
RUN ["mkdir", "-p", "/home/node"]
RUN ["chown", "-R", "node:node", "/home/node"]

# Install the app (server package) and its dependencies
WORKDIR /app
COPY ./packages/server /app
COPY ./yarn.lock /app/yarn.lock
RUN ["yarn", "install", "--frozen-lockfile", "--production", "--network-timeout", "300000"]
RUN ["yarn", "cache", "clean"]

# Inject build-time environment variables
ENV BUILD_GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_GIT_REF=${GIT_REF}
ENV BUILD_TIMESTAMP=${TIMESTAMP}
ENV DD_VERSION=${GIT_COMMIT}

# Start the server
USER node
CMD ["yarn", "start"]
