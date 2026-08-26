FROM node:18-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend ./backend
COPY public-site ./public-site
COPY admin ./admin
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/server.js"]
