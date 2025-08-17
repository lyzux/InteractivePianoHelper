@echo off
echo Starte lokalen Server für Piano Helper...
echo.
echo Öffnen Sie dann: http://localhost:8000
echo.
echo Zum Beenden drücken Sie Ctrl+C
echo.

python -m http.server 8000 2>nul || (
    echo Python nicht gefunden. Versuche mit Node.js...
    npx http-server -p 8000 2>nul || (
        echo Weder Python noch Node.js gefunden.
        echo Bitte installieren Sie Python oder Node.js
        pause
    )
)