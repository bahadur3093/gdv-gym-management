# ── Stage 1: build the React app ────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
# Output is in /app/dist

# ── Stage 2: serve with nginx (tiny, fast, production-grade) ─────────────────
FROM nginx:alpine AS runner

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
