# Riftwatch: one container serving the API and the built site on port 3001.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --no-save tsx
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
# Champion stats, player index and rank history live here; mount a volume to keep them.
VOLUME /app/server/data
EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
