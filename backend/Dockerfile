FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

RUN mkdir -p logs && addgroup -g 1001 -S nodejs && adduser -S datahub -u 1001
USER datahub

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
