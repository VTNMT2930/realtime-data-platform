# Test Scenarios cho Multi-Consumer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🧪 Multi-Consumer Test Scenarios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Show-Menu {
    Write-Host "Select a test scenario:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Test Normal Operation (3 consumers)" -ForegroundColor Green
    Write-Host "2. Test Consumer Failure (start 3, stop 1)" -ForegroundColor Yellow
    Write-Host "3. Test Recovery (restart failed consumer)" -ForegroundColor Cyan
    Write-Host "4. Test Scale Up (start with 2, add 2 more)" -ForegroundColor Magenta
    Write-Host "5. Stop All Consumers" -ForegroundColor Red
    Write-Host "0. Exit" -ForegroundColor Gray
    Write-Host ""
}

function Test-NormalOperation {
    Write-Host ""
    Write-Host "🧪 Test 1: Normal Operation" -ForegroundColor Green
    Write-Host "Starting 3 consumers..." -ForegroundColor Gray
    Write-Host ""
    
    .\start-multiple-consumers.ps1 -NumInstances 3
    
    Write-Host ""
    Write-Host "✅ Expected Result:" -ForegroundColor Cyan
    Write-Host "   Dashboard shows: Active: 3/3" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Gray
    Read-Host
}

function Test-ConsumerFailure {
    Write-Host ""
    Write-Host "🧪 Test 2: Consumer Failure" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Step 1: Starting 3 consumers..." -ForegroundColor Gray
    .\start-multiple-consumers.ps1 -NumInstances 3
    
    Write-Host ""
    Write-Host "Step 2: Wait for all consumers to be active..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "Step 3: Please manually stop Consumer-2 window (close it)" -ForegroundColor Yellow
    Write-Host "Then wait 30 seconds for heartbeat timeout..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Expected Result:" -ForegroundColor Cyan
    Write-Host "   After 30 seconds: Dashboard shows Active: 2/3" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Gray
    Read-Host
}

function Test-Recovery {
    Write-Host ""
    Write-Host "🧪 Test 3: Consumer Recovery" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Restarting consumer-2..." -ForegroundColor Gray
    
    $env:CONSUMER_ID = "consumer-2"
    $env:PORT = 3002
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='consumer-2'; `$env:PORT=3002; Write-Host '=== CONSUMER 2 (Recovery) ===' -ForegroundColor Green; npm run start:dev"
    
    Write-Host ""
    Write-Host "✅ Expected Result:" -ForegroundColor Cyan
    Write-Host "   After 10 seconds: Dashboard shows Active: 3/3" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Gray
    Read-Host
}

function Test-ScaleUp {
    Write-Host ""
    Write-Host "🧪 Test 4: Scale Up" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Step 1: Starting 2 consumers..." -ForegroundColor Gray
    .\start-multiple-consumers.ps1 -NumInstances 2
    
    Write-Host ""
    Write-Host "Dashboard should show: Active: 2/2" -ForegroundColor White
    Write-Host "Press Enter to add 2 more consumers..." -ForegroundColor Yellow
    Read-Host
    
    Write-Host ""
    Write-Host "Step 2: Adding consumer-3 and consumer-4..." -ForegroundColor Gray
    
    # Consumer 3
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='consumer-3'; `$env:PORT=3003; Write-Host '=== CONSUMER 3 ===' -ForegroundColor Cyan; npm run start:dev"
    Start-Sleep -Seconds 3
    
    # Consumer 4
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:CONSUMER_ID='consumer-4'; `$env:PORT=3004; Write-Host '=== CONSUMER 4 ===' -ForegroundColor Magenta; npm run start:dev"
    
    Write-Host ""
    Write-Host "✅ Expected Result:" -ForegroundColor Cyan
    Write-Host "   After 10 seconds: Dashboard shows Active: 4/4" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Gray
    Read-Host
}

# Main loop
do {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  🧪 Multi-Consumer Test Scenarios" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Show-Menu
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" { Test-NormalOperation }
        "2" { Test-ConsumerFailure }
        "3" { Test-Recovery }
        "4" { Test-ScaleUp }
        "5" { 
            Write-Host ""
            Write-Host "Stopping all consumers..." -ForegroundColor Red
            .\stop-consumers.ps1
            Write-Host ""
            Write-Host "Press Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "0" { 
            Write-Host ""
            Write-Host "Goodbye! 👋" -ForegroundColor Cyan
            Write-Host ""
            break
        }
        default {
            Write-Host ""
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "0")
