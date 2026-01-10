@echo off
echo Starting Traveler Friend Application...
echo.

echo [1/4] Killing existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im mongod.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Starting MongoDB...
start "MongoDB" cmd /k "mongod"
timeout /t 5 /nobreak >nul

echo [3/4] Starting Backend Server...
cd /d "C:\Users\sagar\Downloads\A-Traveler-Friend\backend"
start "Backend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo [4/4] Starting Frontend Server...
cd /d "C:\Users\sagar\Downloads\A-Traveler-Friend\frontend"
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ All servers started!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000/api/health
echo.
echo Press any key to test backend...
pause >nul

echo Testing backend connection...
curl http://localhost:5000/api/health
echo.
echo If you see {"success":true,"message":"Server is running"} then it's working!
echo.
pause