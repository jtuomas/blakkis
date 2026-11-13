FROM node:12.22.12-bullseye

ENV TZ=Europe/Helsinki
ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

USER node
CMD ["node", "index.js"]
