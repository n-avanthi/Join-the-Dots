import {
  DOT_COLORS,
  GRID_SIZE,
  DOTS_PER_ROW,
  DOT_RADIUS,
  LINE_STROKE_WIDTH,
  LEVELS,
} from "./config.js";
import { state, DoublyList } from "./gameState.js";
import { nextLevel, resetCurrentLevel } from "./gameController.js";

export function setupCanvas() {
  state.canvas = new fabric.Canvas("game-canvas");
  state.canvas.selection = false;
  fabric.Object.prototype.transparentCorners = false;
}

export function createDots() {
  for (let i = 0; i < DOTS_PER_ROW; i++) {
    for (let n = 0; n < DOTS_PER_ROW; n++) {
      const randomColor = Math.floor(Math.random() * DOT_COLORS.length);
      const dot = new fabric.Circle({
        id: i * DOTS_PER_ROW + n,
        in: false,
        out: false,
        left: n * GRID_SIZE,
        top: i * GRID_SIZE,
        radius: DOT_RADIUS,
        fill: DOT_COLORS[randomColor],
        strokeWidth: 5,
        stroke: "rgba(0,0,0,0)",
        originX: "left",
        originY: "top",
        centeredRotation: true,
        selectable: false,
      });
      state.canvas.add(dot);
    }
  }
}

export function addEventListeners() {
  state.canvas.on("mouse:over", handleMouseOver);
  state.canvas.on("mouse:out", handleMouseOut);
  state.canvas.on("mouse:down", handleMouseDown);
  state.canvas.on("mouse:move", handleMouseMove);
  state.canvas.on("mouse:up", handleMouseUp);
}

function handleMouseOver(e) { // mouse moves over a dot
  if (state.gameEnded || !e.target) return;

  const target = e.target;
  target.setStroke("white");
  target.setStrokeWidth(5);
  if (state.line) {
    handleLineCreation(target);
  }
  state.canvas.renderAll();
}

function handleMouseOut(e) { // mouse moves out of a dot
  if (e.target) {
    e.target.setStroke("rgba(0,0,0,0)");
    state.canvas.renderAll();
  }
}

function handleMouseDown(e) { // mouse is pressed on a dot
  if (state.gameEnded || !e.target) return;

  if (e.target.get("type") === "circle") {
    if (state.lineExists && state.activeLineColor !== e.target.getFill()) {
      console.log("Same color dots must be connected");
      state.line = null;
      return;
    }

    state.activeLineColor = e.target.getFill();
    state.selectedDots.add(e.target.id);
    e.target.out = true;

    const activeCircleCenter = e.target.getCenterPoint();
    state.isDown = true;
    const points = [
      activeCircleCenter.x,
      activeCircleCenter.y,
      activeCircleCenter.x,
      activeCircleCenter.y,
    ];

    state.allLines[state.totalLines] = new fabric.Line(points, {
      strokeWidth: LINE_STROKE_WIDTH,
      stroke: state.activeLineColor,
      originX: "center",
      originY: "center",
    });

    state.line = state.allLines[state.totalLines];
    state.canvas.add(state.line);
  }
}

function handleMouseMove(e) { // mouse moves while the button is held down
  if (state.gameEnded || !state.isDown) return;

  const pointer = state.canvas.getPointer(e.e);
  if (state.line) {
    state.line.set({ x2: pointer.x, y2: pointer.y });
  }
  state.canvas.renderAll();
}

function handleMouseUp(e) { // mouse button is released
  if (state.gameEnded) return;

  state.isDown = false;
  if (e.target === null) {
    state.line.remove();
  } else {
    if (!isValidLine(state.line)) {
      state.line.remove();
    }
  }
  const coordinatesForNewDots = removeSelectedDots();
  addNewDots(coordinatesForNewDots);
}

function handleLineCreation(target) {
  if (!state.line) return;
  if (target.getFill() === state.line.getStroke() && state.isDown) {
    const centerPoint = target.getCenterPoint();
    state.line.set({ x2: centerPoint.x, y2: centerPoint.y });
    state.currentDot = target;

    if (!isValidLine(state.line, target)) {
      return;
    }

    createNewLine(centerPoint);
    updateGameState(target);

    if (target.getFill() === "#05006C") {
      state.connectedBlueDots++;
      updateDotsRemaining();
      checkWinCondition();
    }
  } else {
    state.currentDot = null;
  }
}

function isValidLine(line, target) {
  if (line.x2 !== line.x1 && line.y2 !== line.y1) { // Diagonal lines are not allowed
    return false;
  }
  if (
    Math.abs(line.x2 - line.x1) > GRID_SIZE || // Lines can only be one unit long
    Math.abs(line.y2 - line.y1) > GRID_SIZE 
  ) { 
    return false;
  }
  if (target.in) { // Circle already has an input
    return false;
  }
  if (target.id === state.selectedDots.tail.id) { // Cannot move backwards
    return false;
  }
  return true;
}

function createNewLine(centerPoint) {
  state.lineExists = true;
  state.totalLines++;
  const points = [centerPoint.x, centerPoint.y, centerPoint.x, centerPoint.y];
  state.allLines[state.totalLines] = new fabric.Line(points, {
    strokeWidth: LINE_STROKE_WIDTH,
    stroke: state.activeLineColor,
    originX: "center",
    originY: "center",
  });
  state.line = state.allLines[state.totalLines];
  state.canvas.add(state.line);
}

function updateGameState(target) {
  target.in = true;
  state.selectedDots.add(target.id);
  console.log(state.selectedDots);
}

function removeSelectedDots() {
  if (state.selectedDots._length <= 1) return [];

  const coordinatesForNewDots = [];

  state.canvas.forEachObject((obj) => {
    if (obj.get("type") === "line") {
      animateAndRemove(obj);
      return;
    }

    let currentNode = state.selectedDots.head;
    for (let i = 0; i < state.selectedDots._length; i++) {
      if (currentNode.id === obj.id) {
        coordinatesForNewDots.push({
          x: obj.left,
          y: obj.top,
          id: obj.id,
        });
        animateAndRemove(obj);
      }
      currentNode = currentNode.next;
    }
  });

  state.lineExists = false;
  state.selectedDots = new DoublyList();
  return coordinatesForNewDots;
}

function addNewDots(coordinatesForNewDots) {
  coordinatesForNewDots.forEach((coord) => {
    const randomColor = Math.floor(Math.random() * DOT_COLORS.length);
    const dot = new fabric.Circle({
      id: coord.id,
      in: false,
      out: false,
      left: coord.x,
      top: coord.y - 20,
      radius: DOT_RADIUS,
      fill: DOT_COLORS[randomColor],
      opacity: 0,
      strokeWidth: 5,
      stroke: "rgba(0,0,0,0)",
      originX: "left",
      originY: "top",
      centeredRotation: true,
      selectable: false,
    });
    state.canvas.add(dot);

    dot.animate(
      {
        opacity: "1",
        top: dot.top + 20,
      },
      {
        duration: 950,
        onChange: state.canvas.renderAll.bind(state.canvas),
        easing: fabric.util.ease["easeOutElastic"],
      }
    );
  });
}

function animateAndRemove(obj) {
  obj.animate("opacity", "0", {
    duration: 75,
    onChange: state.canvas.renderAll.bind(state.canvas),
    onComplete: () => state.canvas.remove(obj),
  });
}

export function updateDotsRemaining() {
  const levelConfig = LEVELS.find( // checks each level object in the array to see if its level property matches state.currentLevel
    (level) => level.level === state.currentLevel
  );
  const dotsRemaining = levelConfig.targetBlueDots - state.connectedBlueDots;
  state.dotsRemainingElement.textContent = dotsRemaining;
}

export function checkWinCondition() {
  const levelConfig = LEVELS.find(
    (level) => level.level === state.currentLevel
  );
  if (state.connectedBlueDots >= levelConfig.targetBlueDots) {
    endGame(true);
  }
}

export function startTimer(initialTime) {
  let timeLeft = initialTime;

  const timerInterval = setInterval(() => {
    timeLeft--;

    if (timeLeft === 5) {
      state.timeElement.classList.add("blink");
    }
    if (timeLeft <= 0) {
      stopTimer(timerInterval);
      state.timeElement.textContent = "0";
      state.timeElement.classList.remove("blink");
      endGame(false);
    } else {
      state.timeElement.textContent = timeLeft;
    }
  }, 1000);

  return timerInterval;
}

export function stopTimer(timerInterval) {
  clearInterval(timerInterval);
  if (state.timeElement) {
    state.timeElement.classList.remove("blink");
  }
}

function endGame(won) {
  state.gameEnded = true;

  state.canvas.off("mouse:over");
  state.canvas.off("mouse:out");
  state.canvas.off("mouse:down");
  state.canvas.off("mouse:move");
  state.canvas.off("mouse:up");

  const startTime = parseInt(state.timeElement.getAttribute("data-start-time"));
  const endTime = parseInt(state.timeElement.textContent);
  const timeTaken = startTime - endTime;

  let message, title;
  if (won) {
    title = "Level Completed!";
    if (timeTaken <= startTime / 4) {
      message = "Congratulations! You won with a perfect score of 100!";
    } else if (timeTaken <= startTime / 2) {
      message = "Great job! You won with a score of 75!";
    } else if (timeTaken <= (3 * startTime) / 4) {
      message = "Well done! You won with a score of 50!";
    } else {
      message = "You won with a score of 25!";
    }
  } else {
    title = "Level Failed";
    message = "Try again. You can do it!";
  }

  showModal(title, message, won);
}

function showModal(title, message, won) {
  const modal = document.getElementById("level-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const nextLevelBtn = document.getElementById("next-level-btn");
  const replayBtn = document.getElementById("replay-btn");

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.style.display = "block";

  if (won) {
    nextLevelBtn.style.display = "inline-block";
    replayBtn.style.display = "none";
    nextLevelBtn.onclick = function () {
      modal.style.display = "none";
      nextLevel();
    };
  } else {
    nextLevelBtn.style.display = "none";
    replayBtn.style.display = "inline-block";
    replayBtn.onclick = function () {
      modal.style.display = "none";
      resetCurrentLevel();
    };
  }
}

export {
  handleLineCreation,
  isValidLine,
  createNewLine,
  updateGameState,
  removeSelectedDots,
  addNewDots,
};
