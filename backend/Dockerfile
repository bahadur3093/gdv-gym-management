# Stage 1: install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
# Install tsx for running TypeScript directly
RUN npm install tsx

# Stage 2: production image
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -S gymapp && adduser -S gymapp -G gymapp
USER gymapp

EXPOSE 4000
CMD ["node", "--import", "tsx", "src/server.ts"]
