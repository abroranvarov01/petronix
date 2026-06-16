FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Run as the unprivileged "node" user. Ensure app dir + uploads are writable.
# NOTE: the host-mounted ./uploads must be writable by uid 1000 (node):
#   on the server run once:  chown -R 1000:1000 uploads
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3001
# Apply versioned migrations on start (replaces the old `db push`).
# First-time cutover for a DB that previously used `db push` — run ONCE before
# deploying this image (tables already exist, so just baseline the history):
#   docker compose ... run --rm backend npx prisma migrate resolve --applied 20260616082740_baseline
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
