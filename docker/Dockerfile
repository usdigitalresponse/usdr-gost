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
