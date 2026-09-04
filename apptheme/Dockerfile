# اپ‌تم — ایمیج سبک (برای هر داکرهاست/VPS)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY server.js ./
COPY src ./src
# داده‌ها در والیوم بمانند (مهاجرت آسان)
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]
