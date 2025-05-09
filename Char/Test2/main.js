// Import des classes et constantes
import { GAME_WIDTH, GAME_HEIGHT, GROUND_LEVEL } from './js/gameConstants.js';
import { Game } from './js/Game.js';

// Configuration initiale
document.addEventListener('DOMContentLoaded', () => {
    // Éléments UI
    const loadScreen = document.getElementById('loadScreen');
    const progressBar = document.getElementById('progressBar');
    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    startButton.textContent = 'COMMENCER';
    startButton.style.display = 'none';
    loadScreen.appendChild(startButton);

    // Écran de chargement stylisé
    const loadingText = document.createElement('div');
    loadingText.textContent = 'CHARGEMENT...';
    loadingText.style.color = 'white';
    loadingText.style.fontFamily = 'Arial';
    loadingText.style.fontSize = '24px';
    loadingText.style.marginBottom = '20px';
    loadScreen.insertBefore(loadingText, progressBar);

    // Animation de chargement
    let progress = 0;
    const assetsToLoad = [
        './assets/GrandeTileset.png',
        // Ajouter ici tous les autres assets (sons, etc.)
    ];

    const totalAssets = assetsToLoad.length;
    let loadedAssets = 0;

    function updateProgress() {
        progress = Math.floor((loadedAssets / totalAssets) * 100);
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            loadingText.textContent = 'PRÊT À COMBATTRE !';
            startButton.style.display = 'block';
        }
    }

    // Préchargement des assets
    assetsToLoad.forEach(asset => {
        const img = new Image();
        img.src = asset;
        img.onload = () => {
            loadedAssets++;
            updateProgress();
        };
        img.onerror = () => {
            console.error(`Erreur de chargement: ${asset}`);
            loadedAssets++;
            updateProgress();
        };
    });

    // Initialisation du jeu quand tout est prêt
    startButton.addEventListener('click', () => {
        loadScreen.style.opacity = '0';
        setTimeout(() => {
            loadScreen.style.display = 'none';
            
            // Création de l'instance du jeu
            const game = new Game();
            
            // Redimensionnement responsive
            function resizeGame() {
                const windowRatio = window.innerWidth / window.innerHeight;
                const gameRatio = GAME_WIDTH / GAME_HEIGHT;
                
                if (windowRatio < gameRatio) {
                    const scale = window.innerWidth / GAME_WIDTH;
                    game.canvas.style.transform = `scale(${scale})`;
                    game.uiCanvas.style.transform = `scale(${scale})`;
                } else {
                    const scale = window.innerHeight / GAME_HEIGHT;
                    game.canvas.style.transform = `scale(${scale})`;
                    game.uiCanvas.style.transform = `scale(${scale})`;
                }
            }
            
            window.addEventListener('resize', resizeGame);
            resizeGame();
            
            // Démarrer le jeu
            game.startGame();
            
        }, 500);
    });

    // Fallback si tout est déjà chargé
    if (totalAssets === 0) {
        progress = 100;
        updateProgress();
    }
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    const errorScreen = document.createElement('div');
    errorScreen.style.position = 'fixed';
    errorScreen.style.top = '0';
    errorScreen.style.left = '0';
    errorScreen.style.width = '100%';
    errorScreen.style.height = '100%';
    errorScreen.style.backgroundColor = 'rgba(0,0,0,0.9)';
    errorScreen.style.color = 'red';
    errorScreen.style.display = 'flex';
    errorScreen.style.flexDirection = 'column';
    errorScreen.style.justifyContent = 'center';
    errorScreen.style.alignItems = 'center';
    errorScreen.style.zIndex = '1000';
    errorScreen.style.fontFamily = 'Arial';
    
    const errorTitle = document.createElement('h1');
    errorTitle.textContent = 'ERREUR';
    errorTitle.style.fontSize = '48px';
    
    const errorMsg = document.createElement('p');
    errorMsg.textContent = e.message;
    errorMsg.style.fontSize = '24px';
    errorMsg.style.maxWidth = '80%';
    errorMsg.style.textAlign = 'center';
    
    const errorStack = document.createElement('pre');
    errorStack.textContent = e.error.stack;
    errorStack.style.maxWidth = '80%';
    errorStack.style.overflow = 'auto';
    errorStack.style.backgroundColor = '#222';
    errorStack.style.padding = '20px';
    
    errorScreen.appendChild(errorTitle);
    errorScreen.appendChild(errorMsg);
    errorScreen.appendChild(errorStack);
    
    document.body.appendChild(errorScreen);
});