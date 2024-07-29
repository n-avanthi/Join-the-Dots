import { initializeGame } from './gameController.js';
import { updateCurrentLevel } from './gameState.js';

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentLevel(1);
    initializeGame();
});