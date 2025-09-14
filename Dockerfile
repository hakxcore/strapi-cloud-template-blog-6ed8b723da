# Stage 1: Build
FROM node:22-alpine AS build

RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev vips-dev git bash

WORKDIR /opt/app

# Copy package.json first for cachin
COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

# Copy full project
COPY . .

# Build Strapi admin
RUN yarn build

# Stage 2: Run
FROM node:22-alpine

RUN apk add --no-cache vips-dev bash

WORKDIR /opt/app

COPY --from=build /opt/app ./

ENV NODE_ENV=production
ENV PATH=/opt/app/node_modules/.bin:$PATH

EXPOSE 1339

CMD ["yarn", "start"]