Write-Host "🚀 Starting PalmAuth Demo Environment..." -ForegroundColor Cyan

Write-Host "1/3 Starting Python Neural Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd ..\palm_ml\neural_engine; ..\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`""

Write-Host "2/3 Starting Java Spring Boot Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd ..\palm_backend; mvn spring-boot:run`""

Write-Host "3/3 Starting React Edge UI (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"npm run dev`""

Write-Host "✅ All services starting! The frontend will be available at http://localhost:5173" -ForegroundColor Green
Write-Host "Make sure your MySQL database is active on port 3306." -ForegroundColor White
