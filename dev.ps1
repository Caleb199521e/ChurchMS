# Church CMS Development Script - Start both backend and frontend

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "   Church CMS - Development Environment"  -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "Starting Backend Server (Port 3000)..." -ForegroundColor Green
Start-Process "powershell" -ArgumentList "-NoExit -Command cd backend ; npm run dev" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process "powershell" -ArgumentList "-NoExit -Command cd frontend ; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "   Both servers are starting..."         -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close either window to stop that server." -ForegroundColor Gray
Write-Host ""
