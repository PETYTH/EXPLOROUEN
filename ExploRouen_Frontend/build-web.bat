@echo off
echo Building ExploRouen PWA...
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Exporting web version...
call npx expo export --platform web

echo.
echo Step 3: Build completed!
echo The PWA is ready in the 'dist' folder
echo.
echo Next steps:
echo 1. Upload the 'dist' folder to Netlify
echo 2. Your app will be accessible via the provided URL
echo 3. Users can install it as a PWA from their browser
echo.
pause
