# PowerShell script để stop tất cả consumer instances
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping All Consumer Instances" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Đọc PIDs từ file
$pidFile = "$PSScriptRoot\consumer-pids.txt"

if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    
    foreach ($pid in $pids) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping process PID: $pid" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force
                Write-Host "  ✓ Stopped" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ✗ Process $pid not found" -ForegroundColor Red
        }
    }
    
    # Xóa file PIDs
    Remove-Item $pidFile
    Write-Host ""
    Write-Host "All consumers stopped!" -ForegroundColor Green
} else {
    Write-Host "No consumer PIDs found. Searching for npm processes..." -ForegroundColor Yellow
    
    # Tìm và kill tất cả npm processes trong thư mục consumer-service
    $npmProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
        Where-Object { $_.Path -like "*consumer-service*" }
    
    if ($npmProcesses) {
        foreach ($proc in $npmProcesses) {
            Write-Host "Stopping node process PID: $($proc.Id)" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force
        }
        Write-Host "All node processes stopped!" -ForegroundColor Green
    } else {
        Write-Host "No running consumer processes found." -ForegroundColor Gray
    }
}

Write-Host ""
