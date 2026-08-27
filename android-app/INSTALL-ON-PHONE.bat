@echo off
title WHERE IS IT - Install APK on Android Phone
color 0B
cls
echo.
echo  ============================================================
echo   WHERE IS IT -- Direct USB Install on Android Phone
echo  ============================================================
echo.
echo  REQUIREMENTS:
echo   - USB cable connected to Android phone
echo   - Enable: Settings ^> Developer Options ^> USB Debugging
echo.
echo  Press any key to install APK via ADB...
pause >nul

:: Look for ADB in common locations
set ADB_PATH=
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if exist "C:\Android\Sdk\platform-tools\adb.exe" set "ADB_PATH=C:\Android\Sdk\platform-tools\adb.exe"

if "%ADB_PATH%"=="" (
    echo  ERROR: ADB not found. Please install Android Studio first.
    echo  Download: https://developer.android.com/studio
    pause
    exit /b 1
)

"%ADB_PATH%" install -r "WhereIsIt-Finder-AI.apk"
if errorlevel 1 (
    echo.
    echo  FAILED. Check:
    echo   1. USB cable is connected
    echo   2. USB Debugging is ON in Developer Options
    echo   3. Phone shows "Allow USB Debugging?" dialog - tap Allow
) else (
    echo.
    echo  ============================================================
    echo   SUCCESS! WHERE IS IT installed on your Android phone!
    echo   Open "WHERE IS IT" from your App Drawer!
    echo  ============================================================
)
pause
