// main.js
import { initializeGame } from './gameController.js';
import { state, updateCurrentLevel } from './gameState.js';

document.addEventListener('DOMContentLoaded', () => {
    // Remove this line
    // const savedLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    
    // Instead, always start from level 1 when the game is loaded from the main page
    updateCurrentLevel(1);
    
    initializeGame();
});