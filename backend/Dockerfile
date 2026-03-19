# ── Stage 1: install dependencies ──────────────────────────────────────────
FROM node:18-alpine AS deps

# Why alpine? Smallest possible image (~5MB base vs ~900MB for full node)
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ── Stage 2: production image ───────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only what's needed — not the entire repo
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run as root inside the container (security best practice)
RUN addgroup -S gymapp && adduser -S gymapp -G gymapp
USER gymapp

EXPOSE 4000

CMD ["node", "server.js"]
