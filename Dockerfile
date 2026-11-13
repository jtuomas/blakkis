FROM node:22-bookworm-slim

# Fonts for chart labels rendered by canvas
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core fontconfig tzdata \
  && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Helsinki
ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

USER node
CMD ["node", "index.js"]
