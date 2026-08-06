# NovaFleet API
# Node 22+ is required: @supabase/supabase-js (realtime-js) needs a native
# global WebSocket, which is not available on Node 20.
FROM node:22-alpine
WORKDIR /app

# Install production dependencies first (better layer caching).
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]
