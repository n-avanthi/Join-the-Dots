// main.js
import { initializeGame } from './gameController.js';
import { state } from './gameState.js';

document.addEventListener('DOMContentLoaded', () => {
    const savedLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    state.currentLevel = savedLevel;
    initializeGame();
});