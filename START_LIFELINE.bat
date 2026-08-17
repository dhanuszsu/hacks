@echo off
title LifeLine PHC Triage Launcher
echo ========================================================
echo       LIFELINE - RURAL PHC TRIAGE SYSTEM
echo ========================================================
echo.
echo Checking environment...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your computer!
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

echo [1/3] Checking server dependencies...
cd server
if not exist node_modules (
    echo Installing server packages...
    call npm install
)

echo.
echo [2/3] Starting LifeLine Backend & Frontend on Port 5000...
start "" http://localhost:5000
node server.js

pause
