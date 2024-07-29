import { LEVELS } from "./config.js";
import { state, resetState } from "./gameState.js";
import { setupCanvas, createDots, addEventListeners, startTimer, updateDotsRemaining, stopTimer, } from "./gameLogic.js";

let currentTimerInterval;

export function initializeGame() {
  const levelConfig = LEVELS[state.currentLevel - 1]; // indices in JavaScript start at 0
  if (!levelConfig) {
    console.error("Invalid level");
    return;
  }

  state.timeElement = document.querySelector(".time-display");
  if (!state.timeElement) {
    console.error("Time display element not found");
    return;
  }

  if (!state.canvas) {
    setupCanvas();
  } else {
    state.canvas.clear();
  }
  createDots();
  addEventListeners();

  if (currentTimerInterval) {
    stopTimer(currentTimerInterval);
  }
  currentTimerInterval = startTimer(levelConfig.initialTime);
  updateUIForNewLevel(levelConfig);
}

function updateUIForNewLevel(levelConfig) {
  document.getElementById("target-dots").textContent = levelConfig.targetBlueDots;
  document.getElementById("initial-time").textContent = levelConfig.initialTime;
  document.getElementById("current-level").textContent = state.currentLevel;

  state.timeElement.textContent = levelConfig.initialTime;
  state.timeElement.setAttribute("data-start-time", levelConfig.initialTime);

  state.dotsRemainingElement = document.querySelector(".dots-remaining-display");
  if (!state.dotsRemainingElement) {
    console.error("Dots remaining display element not found");
    return;
  }
  state.dotsRemainingElement.textContent = levelConfig.targetBlueDots;

  updateDotsRemaining();
}

export function nextLevel() {
  if (state.currentLevel < LEVELS.length) {
      updateCurrentLevel(state.currentLevel + 1);
      resetGame();
  } else {
      showFinalModal(); // Game completed
  }
}

function updateCurrentLevel(level) {
    state.currentLevel = level;
    localStorage.setItem('currentLevel', level);
}

export function resetCurrentLevel() {
    const modal = document.getElementById('level-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    resetGame(); // No need to update localStorage here as we're keeping the same level
}

function resetGame() {
  resetState();
  initializeGame();
}

function showFinalModal() {
  const modal = document.getElementById("level-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const nextLevelBtn = document.getElementById("next-level-btn");
  const replayBtn = document.getElementById("replay-btn");

  modalTitle.textContent = "Congratulations!";
  modalMessage.textContent = "You've completed all levels!";
  modal.style.display = "block";

  nextLevelBtn.style.display = "none";
  replayBtn.style.display = "inline-block";
  replayBtn.textContent = "Play Again";
  replayBtn.onclick = function() {
    localStorage.removeItem('currentLevel');  // Clear stored level
    updateCurrentLevel(1);  // Reset to level 1
    resetGame();
    modal.style.display = 'none';
  };
}
