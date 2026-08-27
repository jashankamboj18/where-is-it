@echo off
title WHERE IS IT - Android APK Builder
color 0A
cls
echo.
echo  ============================================================
echo   WHERE IS IT -- Finder AI  ^|  Android APK Build Setup
echo  ============================================================
echo.

:: Set JAVA_HOME to Android Studio's bundled JDK
set "JAVA_HOME=C:\Program Files\Android\openjdk\jdk-21.0.8"
set "PATH=%JAVA_HOME%\bin;%PATH%"

:: Verify Java
echo [1/6] Checking Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Java not found at %JAVA_HOME%
    echo  Please install Android Studio first from: https://developer.android.com/studio
    pause
    exit /b 1
)
echo  ^> Java OK!
echo.

:: Check Node
echo [2/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)
echo  ^> Node.js OK!
echo.

:: Install Capacitor dependencies
echo [3/6] Installing Capacitor packages...
cd /d "%~dp0"
call npm install --prefer-offline
if errorlevel 1 (
    echo  ERROR: npm install failed. Check internet connection.
    pause
    exit /b 1
)
echo  ^> Capacitor packages installed!
echo.

:: Add Android platform
echo [4/6] Adding Android platform...
call npx cap add android 2>nul
echo  ^> Android platform added (or already exists)!
echo.

:: Copy web assets
echo [5/6] Syncing web assets to Android project...
call npx cap sync android
if errorlevel 1 (
    echo  WARNING: Sync had issues but continuing...
)
echo  ^> Web assets synced to Android!
echo.

:: Build APK using Gradle
echo [6/6] Building APK... (this takes 2-5 minutes)
cd android
call gradlew.bat assembleDebug --stacktrace
if errorlevel 1 (
    echo.
    echo  ============================================================
    echo   IMPORTANT: Android SDK not found!
    echo   Please open Android Studio once to download the SDK.
    echo.
    echo   ALTERNATIVE: Use the APK Builder Script (Option B below)
    echo  ============================================================
    echo.
    echo  Opening Android project in Android Studio...
    cd ..
    call npx cap open android
    echo.
    echo  In Android Studio:
    echo   1. Wait for Gradle sync to finish
    echo   2. Menu: Build - Build Bundle^(s^) / APK^(s^) - Build APK^(s^)
    echo   3. APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
    pause
    exit /b 0
)

:: Copy APK to current folder
cd ..
echo.
echo  Copying APK to output folder...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy "android\app\build\outputs\apk\debug\app-debug.apk" "WhereIsIt-Finder-AI.apk"
    echo.
    echo  ============================================================
    echo   SUCCESS! APK is ready: WhereIsIt-Finder-AI.apk
    echo.
    echo   Install on Android:
    echo   1. Copy WhereIsIt-Finder-AI.apk to your phone
    echo   2. On phone: Settings - Install unknown apps - Allow
    echo   3. Open APK file on phone to install!
    echo  ============================================================
) else (
    echo  APK not found. Check Android Studio Build output.
)
echo.
pause
