@echo off
rem Deploys Riftwatch to Fly.io and writes the output to deploy.log (read by Claude during the improvement loop).
cd /d "%~dp0"
echo Deploy started %date% %time% > deploy.log
set FLY=fly
where fly >nul 2>&1 || set FLY="%USERPROFILE%\.fly\bin\flyctl.exe"
%FLY% deploy --remote-only >> deploy.log 2>&1
echo EXIT CODE %errorlevel% >> deploy.log
echo Deploy finished %date% %time% >> deploy.log
