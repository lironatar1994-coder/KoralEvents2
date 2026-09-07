FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/koral.sqlite UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/data /app/uploads /backups && chown -R node:node /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/scripts/backup.mjs ./scripts/backup.mjs
COPY --from=builder --chown=node:node /app/scripts/rotate-password.mjs ./scripts/rotate-password.mjs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
