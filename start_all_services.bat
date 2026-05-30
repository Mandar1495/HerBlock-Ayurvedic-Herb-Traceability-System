@echo off
echo Starting DB is already handled (MongoDB is running on port 27017)

echo Skipping Blockchain Setup (Fabric) because Go is not installed in WSL.
echo The backend will automatically use the built-in Mock Blockchain (Fallback Mode).

echo Starting Backend...
start "HerBlock - Backend" cmd /k "cd e:\edisih\SIH-blockchain\backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend...
start "HerBlock - Frontend" cmd /k "cd e:\edisih\SIH-blockchain\frontend && npm start"

echo Starting Mobile App (Expo Tunnel)...
start "HerBlock - Mobile App" cmd /k "cd e:\edisih\SIH-blockchain\mobile-app && node start-tunnel.js"

echo All services have been launched!
