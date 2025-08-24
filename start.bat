@echo off
echo Starting Individual Contractor Details Dashboard...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm install && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both services are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 