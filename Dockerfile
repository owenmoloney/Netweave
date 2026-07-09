# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY client client
COPY server server
COPY shared shared
COPY eslint.config.js .prettierrc ./
ENV VITE_API_BASE_URL=/api/v1
RUN cd server && pnpm db:generate
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL=file:/data/netweave.db
ENV CLIENT_DIST_PATH=/app/client/dist
ENV CORS_ORIGIN=http://localhost:8080

RUN apk add --no-cache openssl

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/shared ./shared
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app/server
EXPOSE 8080

VOLUME ["/data"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
