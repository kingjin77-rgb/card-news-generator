@echo off
chcp 65001 > nul
set FILE=%~dp0card-news-generator.html
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%FILE%"
