# Use a modern Node.js image (Next.js requires >= 20.9)
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy all source code
COPY . .

# Build the Next.js app
RUN pnpm build

# --- Production Image ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Expose port (Next.js default)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
