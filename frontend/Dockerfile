FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Run as the unprivileged "node" user (next start needs read + .next/cache).
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "run", "start"]
