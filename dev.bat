@echo off
REM Church CMS Development Script - Start both backend and frontend

echo.
echo ========================================
echo   Church CMS - Development Environment
echo ========================================
echo.

REM Start backend in a new window
echo Starting Backend Server (Port 3000)...
start "Church CMS - Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend in a new window
echo Starting Frontend Server (Port 5173)...
start "Church CMS - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Close either window to stop that server.
echo.
pause
