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
CMD ["sh", "-c", "npx prisma db push --url \"$DATABASE_URL\" && npm run start:prod"]
