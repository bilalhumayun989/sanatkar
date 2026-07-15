@echo off
echo ===================================
echo Fixing Next.js API Routes
echo ===================================
echo.

echo Step 1: Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo Step 2: Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo Cache cleared.
echo.

echo Step 3: Clearing node_modules cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Node cache cleared.
echo.

echo Step 4: Checking for .env.local file...
if not exist .env.local (
    echo WARNING: .env.local not found!
    echo Please create .env.local with your DATABASE_URL
    echo See .env.example for template
    echo.
) else (
    echo .env.local found.
)
echo.

echo ===================================
echo Fix complete!
echo ===================================
echo.
echo Next steps:
echo 1. Make sure .env.local exists with DATABASE_URL
echo 2. Run: npm run dev
echo 3. Test the APIs at http://localhost:3000
echo.
pause
