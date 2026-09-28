@echo off
echo ===================================
echo SanatKar Setup Check
echo ===================================
echo.

echo Checking environment...
echo.

if exist .env.local (
    echo [OK] .env.local exists
) else (
    echo [WARNING] .env.local not found!
    echo Please create it from .env.example
)
echo.

if exist node_modules (
    echo [OK] node_modules exists
) else (
    echo [WARNING] node_modules not found!
    echo Run: npm install
)
echo.

if exist .next (
    echo [OK] .next build folder exists
) else (
    echo [INFO] .next folder not found (will be created on first run)
)
echo.

if exist prisma\schema.prisma (
    echo [OK] Prisma schema found
) else (
    echo [WARNING] Prisma schema not found!
)
echo.

echo ===================================
echo API Routes Status:
echo ===================================
dir /b app\api\cars\route.ts 2>nul && echo [OK] /api/cars route exists || echo [ERROR] /api/cars route missing!
dir /b app\api\seller\orders\route.ts 2>nul && echo [OK] /api/seller/orders route exists || echo [ERROR] /api/seller/orders route missing!
dir /b app\api\seller\products\route.ts 2>nul && echo [OK] /api/seller/products route exists || echo [ERROR] /api/seller/products route missing!
dir /b app\api\health\route.ts 2>nul && echo [OK] /api/health route exists || echo [ERROR] /api/health route missing!
echo.

echo ===================================
echo Next Steps:
echo ===================================
echo 1. Ensure .env.local has DATABASE_URL
echo 2. Run: npm run dev
echo 3. Visit: http://localhost:3000/api/health
echo 4. Check for "database": "CONNECTED"
echo.

pause
