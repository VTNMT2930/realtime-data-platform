# Giai đoạn 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
# Copy file package.json và package-lock.json
COPY backend/consumer-service/package.json backend/consumer-service/package-lock.json ./
# Cài đặt dependencies
RUN npm install
# Copy toàn bộ source code của service consumer
COPY backend/consumer-service/ ./
# Copy các file chung (nếu có, ví dụ tsconfig)
COPY tsconfig.json tsconfig.build.json ./
# Build ứng dụng NestJS
RUN npm run build --prefix backend/consumer-service

# Giai đoạn 2: Production
FROM node:18-alpine
WORKDIR /app
# Copy dependencies đã cài đặt từ giai đoạn 'builder'
COPY --from=builder /app/node_modules ./node_modules
# Copy code đã build từ giai đoạn 'builder'
COPY --from=builder /app/dist/backend/consumer-service ./dist
# Expose port (Dựa theo code của bạn là 3001)
EXPOSE 3001
# Lệnh chạy ứng dụng
CMD ["node", "dist/main"]
