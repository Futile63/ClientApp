# Client Command Center - run on NAS or any Docker host
FROM node:20-alpine

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app code
COPY server.js app.js index.html tier.html client-list.html style.css ./

# Data is written to /app/data at runtime (mount a volume)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
