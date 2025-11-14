@echo off
REM Batch script to start multiple consumer instances
REM Usage: start-consumers.bat [number_of_instances]

SET NUM_INSTANCES=%1
IF "%NUM_INSTANCES%"=="" SET NUM_INSTANCES=2

echo ========================================
echo   Starting %NUM_INSTANCES% Consumer Instances
echo ========================================
echo.

REM Loop to start each instance
FOR /L %%i IN (1,1,%NUM_INSTANCES%) DO (
    SET CONSUMER_ID=consumer-%%i
    SET PORT=300%%i
    
    echo [%%i/%NUM_INSTANCES%] Starting Consumer: consumer-%%i on port 300%%i
    
    REM Start in new window
    start "Consumer-%%i" cmd /k "set CONSUMER_ID=consumer-%%i && set PORT=300%%i && npm run start:dev"
    
    echo    - Consumer ID: consumer-%%i
    echo    - Port: 300%%i
    echo.
    
    REM Wait 3 seconds before starting next instance
    timeout /t 3 /nobreak > nul
)

echo ========================================
echo   All %NUM_INSTANCES% consumers started!
echo ========================================
echo.
echo To stop all consumers, close their windows or press Ctrl+C in each window.
echo.
pause
