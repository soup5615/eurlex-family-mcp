# eurlex-family — image Docker multi-stages
#
# Stage 1 : compile le code TypeScript.
# Stage 2 : runtime minimal avec Chromium embarqué pour la
#           génération de PDF.

# ─── Stage 1 : build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Dépendances (inclut devDependencies pour compiler).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Code source + build.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2 : runtime ──────────────────────────────────────────
FROM node:20-alpine AS runtime

# Chromium pour le rendu PDF (renderPdf cherche CHROME_PATH).
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
    && rm -rf /var/cache/apk/*

ENV CHROME_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV PORT=4050
ENV HOST=0.0.0.0
ENV DATA_PATH=/app/data/cases.json

WORKDIR /app

# Dépendances de production uniquement.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --omit=dev \
    && npm cache clean --force

# Application compilée.
COPY --from=builder /app/dist ./dist

# Volume pour la persistance des cas / utilisateurs.
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 4050

# Healthcheck léger pour docker compose.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/health" >/dev/null || exit 1

CMD ["node", "dist/server/cli.js"]
