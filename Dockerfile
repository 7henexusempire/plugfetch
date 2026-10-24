FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for build
RUN npm install

# Copy application sources
COPY . .

# Build both client SPA and server bundle
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

# Copy production package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets and server from builder
COPY --from=builder /app/dist ./dist

# Create persistent storage folder for playlist cache and customizations
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

# Persistent volume for channel overrides and cached playlists
VOLUME ["/app/data"]

CMD ["node", "dist/server.js"]
