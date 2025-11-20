# File: deploy.ps1
Write-Host "🚀 Bắt đầu Deploy Frontend..." -ForegroundColor Green

# 1. Build
Write-Host "📦 Đang Build..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build thất bại!"; exit }

# 2. Upload S3
Write-Host "⬆️ Đang Upload lên S3..."
aws s3 sync dist s3://my-realtime-platform-frontend-app --delete --acl public-read

# 3. Clear Cache
Write-Host "🧹 Đang xóa Cache CloudFront..."
aws cloudfront create-invalidation --distribution-id E8KDTK8FUV8UP --paths "/*"

Write-Host "✅ XONG! Web đã được cập nhật." -ForegroundColor Cyan