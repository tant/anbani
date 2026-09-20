FROM node:24-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM alpine:3.24 AS pocketbase
RUN apk add --no-cache curl unzip
WORKDIR /app
COPY scripts/get-pocketbase.sh scripts/
RUN sh scripts/get-pocketbase.sh

FROM alpine:3.24
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=pocketbase /app/pb/pocketbase ./pocketbase
COPY pb/pb_migrations ./pb_migrations
COPY --from=web /app/build ./pb_public
EXPOSE 8090
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=pb_data", "--migrationsDir=pb_migrations", "--publicDir=pb_public"]
