# Giai đoạn 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
# Copy file package.json và package-lock.json
COPY backend/api-gateway-producer/package.json backend/api-gateway-producer/package-lock.json ./
# Cài đặt dependencies
RUN npm install
# Copy toàn bộ source code của service producer
COPY backend/api-gateway-producer/ ./
# Build ứng dụng NestJS
RUN npm run build
# Giai đoạn 2: Production
FROM node:18-alpine
WORKDIR /app
# Copy dependencies đã cài đặt từ giai đoạn 'builder'
COPY --from=builder /app/node_modules ./node_modules
# Copy code đã build từ giai đoạn 'builder'
COPY --from=builder /app/dist ./dist
# Expose port (Dựa theo code của bạn là 3000)
EXPOSE 3000
# Lệnh chạy ứng dụng
CMD ["node", "dist/main"]