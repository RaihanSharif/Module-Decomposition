FROM node:26.7.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
USER node
ENTRYPOINT ["node", "app.js"]