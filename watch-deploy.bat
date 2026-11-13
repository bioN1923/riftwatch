@echo off
rem Riftwatch auto-deploy helper. Leave this window open: whenever a file named
rem deploy.request appears in this folder, it is removed and deploy.bat runs once.
rem Claude creates deploy.request at the end of each improvement-loop iteration.
rem Close this window (or press Ctrl+C) to stop it.
title Riftwatch auto-deploy - close this window to stop
cd /d "%~dp0"
echo Watching for deploy.request in %cd%
echo Close this window to stop.
:loop
if exist deploy.request (
  del deploy.request
  echo [%date% %time%] Deploy requested, running deploy.bat...
  call deploy.bat
  echo [%date% %time%] Done. See deploy.log. Watching again...
)
timeout /t 10 /nobreak >nul
goto loop
