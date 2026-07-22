# ==========================================
# Stage 1: Build & Dependency Install
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

# Install only production dependencies (omit devDependencies)
RUN npm ci --omit=dev

# Copy source directory from builder stage
COPY --from=builder /usr/src/app/src ./src

# Expose server port
EXPOSE 5000

# Start app
CMD ["npm", "start"]
