FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY build ./build
COPY drizzle.config.ts ./drizzle.config.ts
COPY src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["bun", "run", "build/index.js"]
