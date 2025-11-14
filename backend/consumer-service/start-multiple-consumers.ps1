# PowerShell script để chạy nhiều consumer instances
# Sử dụng: .\start-multiple-consumers.ps1 -NumInstances 3

param(
    [int]$NumInstances = 2  # Mặc định chạy 2 instances
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting $NumInstances Consumer Instances" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Array để lưu các process
$processes = @()

# Chạy từng instance
for ($i = 1; $i -le $NumInstances; $i++) {
    $consumerId = "consumer-$i"
    
    Write-Host "[$i/$NumInstances] Starting Consumer: $consumerId" -ForegroundColor Green
    
    # Chỉ cần set CONSUMER_ID, port sẽ tự động tìm
    $process = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='$consumerId'; Write-Host '=== CONSUMER $i ===' -ForegroundColor Cyan; npm run start:dev" `
        -PassThru `
        -WindowStyle Normal
    
    $processes += $process
    
    Write-Host "   ✓ Consumer ID: $consumerId" -ForegroundColor Gray
    Write-Host "   ✓ Port: Auto-assigned (starting from 3001)" -ForegroundColor Gray
    Write-Host "   ✓ PID: $($process.Id)" -ForegroundColor Gray
    Write-Host ""
    
    # Đợi 3 giây trước khi start instance tiếp theo
    Start-Sleep -Seconds 3
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All $NumInstances consumers started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Consumer instances:" -ForegroundColor Yellow
for ($i = 1; $i -le $NumInstances; $i++) {
    Write-Host "  - consumer-$i (port auto-assigned starting from 3001+)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "To stop all consumers, run: .\stop-consumers.ps1" -ForegroundColor Yellow
Write-Host ""

# Lưu PIDs vào file để dễ dàng stop sau
$processes | ForEach-Object { $_.Id } | Out-File -FilePath "$PSScriptRoot\consumer-pids.txt"
