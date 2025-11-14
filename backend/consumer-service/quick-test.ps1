# Quick Test Script - Start 2 consumers để test ngay
Write-Host "🚀 Quick Test: Starting 2 Consumer Instances..." -ForegroundColor Cyan
Write-Host ""

# Consumer 1
Write-Host "Starting Consumer 1..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='consumer-1'; Write-Host '=== CONSUMER 1 ===' -ForegroundColor Green; npm run start:dev"

Start-Sleep -Seconds 5

# Consumer 2
Write-Host "Starting Consumer 2..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='consumer-2'; Write-Host '=== CONSUMER 2 ===' -ForegroundColor Yellow; npm run start:dev"

Write-Host ""
Write-Host "✅ Done! Ports will be auto-assigned (3001, 3002, ...)" -ForegroundColor Cyan
Write-Host "Check Dashboard at http://localhost:5173" -ForegroundColor Cyan
Write-Host "Expected: Active: 2/2" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop, run: .\stop-consumers.ps1" -ForegroundColor Gray
