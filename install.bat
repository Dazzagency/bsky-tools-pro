@echo off
echo Installation de DazzTools Pro...
echo.

:: Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Installation de Node.js...
    :: Télécharger et installer Node.js
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.0/node-v16.20.0-x64.msi' -OutFile 'node-installer.msi'"
    start /wait node-installer.msi
    del node-installer.msi
)

:: Installer les dépendances
echo Installation des dépendances...
npm install

:: Build l'application
echo Construction de l'application...
npm run build:win

echo.
echo Installation terminée ! Vous trouverez l'exécutable dans le dossier dist.
echo Pour toute assistance : @Dazzagency sur Telegram
pause