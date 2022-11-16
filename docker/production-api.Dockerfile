FROM node:16.14.0-alpine as app_base

# Prepare the environment
RUN ["apk", "--update", "add", "bash", "postgresql-client"]
RUN ["mkdir", "-p", "/home/node"]
RUN ["chown", "-R", "node:node", "/home/node"]

# Install the app (server package) and its dependencies
WORKDIR /app
COPY ./packages/server /app
RUN ["yarn", "install", "--frozen-lockfile"]
RUN ["yarn", "cache", "clean"]

# Start the server
USER node
CMD ["yarn", "start"]
