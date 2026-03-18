FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY public/ ./public/

RUN mkdir -p /app/data

ENV PORT=3000
ENV DB_PATH=/app/data/calendar.db

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server/index.cjs"]
