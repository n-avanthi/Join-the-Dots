// Constants and Configuration
const DOT_COLORS = [
    "#FFC300", // yellow
    "#039012", // green
    "#C70039", // red
    "#05006C"  // blue
]; 
const GRID_SIZE = 60;
const DOTS_PER_ROW = 6; 
const DOT_RADIUS = 15;
const LINE_STROKE_WIDTH = 12;
const INITIAL_TIME = 60;
const TARGET_BLUE_DOTS = 10;

// Game State
let selectedDots = new DoublyList(); 
let currentDot; 
let line;
let isDown = false;
let lineExists = false;
let totalLines = 0;
let activeLineColor = "#000"; 
let allLines = [];
let connectedBlueDots = 0;
let gameEnded = false; 

// DOM Elements
let canvas;
let timeElement;
let dotsRemainingElement;

// Initialize the game
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    setupCanvas();
    createDots();
    addEventListeners();
    const startTime = startTimer();
    document.querySelector('.time-display').setAttribute('data-start-time', startTime);

    document.getElementById('target-dots').textContent = TARGET_BLUE_DOTS;
    document.getElementById('initial-time').textContent = INITIAL_TIME;

    timeElement = document.querySelector('.time-display');
    timeElement.textContent = INITIAL_TIME;
    timeElement.setAttribute('data-start-time', INITIAL_TIME);
    
    dotsRemainingElement = document.querySelector('.dots-remaining-display');
    dotsRemainingElement.textContent = TARGET_BLUE_DOTS;
}

function setupCanvas() {
    canvas = new fabric.Canvas('game-canvas');
    canvas.selection = false;
    fabric.Object.prototype.transparentCorners = false;
}

function createDots() {
    for (let i = 0; i < DOTS_PER_ROW; i++) {
        for (let n = 0; n < DOTS_PER_ROW; n++) {
            const randomColor = Math.floor(Math.random() * DOT_COLORS.length);
            const dot = new fabric.Circle({
                id: (i * DOTS_PER_ROW) + n,
                in: false,
                out: false,
                left: n * GRID_SIZE,
                top: i * GRID_SIZE,
                radius: DOT_RADIUS,
                fill: DOT_COLORS[randomColor], 
                strokeWidth: 5, 
                stroke: 'rgba(0,0,0,0)',
                originX: 'left',
                originY: 'top',
                centeredRotation: true,
                selectable: false
            });
            canvas.add(dot);
        }
    }
}

function addEventListeners() {
    canvas.on('mouse:over', handleMouseOver);
    canvas.on('mouse:out', handleMouseOut);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}

// Event Handlers
function handleMouseOver(e) {
    if (gameEnded) return;
    
    const target = e.target;
    target.setStroke('white');
    target.setStrokeWidth(5);
    if (line) {
        handleLineCreation(target);
    }
    canvas.renderAll();
}

function handleMouseOut(e) {
    e.target.setStroke('rgba(0,0,0,0)');
    canvas.renderAll();
}

function handleMouseDown(e) {
    if (gameEnded) return;

    if (e.target.get('type') === "circle") {
        if (lineExists && activeLineColor !== e.target.getFill()) {
            console.log("Color does not match existing.");
            line = null;
            return;
        }

        activeLineColor = e.target.getFill();
        selectedDots.add(e.target.id);
        e.target.out = true;
        console.log(selectedDots);

        const activeCircleCenter = e.target.getCenterPoint();
        isDown = true;
        const points = [activeCircleCenter.x, activeCircleCenter.y, activeCircleCenter.x, activeCircleCenter.y];

        allLines[totalLines] = new fabric.Line(points, {
            strokeWidth: LINE_STROKE_WIDTH,
            stroke: activeLineColor,
            originX: 'center',
            originY: 'center'
        });

        line = allLines[totalLines];
        canvas.add(line);
    }
}

function handleMouseMove(e) {
    if (gameEnded || !isDown) return;

    const pointer = canvas.getPointer(e.e);
    if (line) {
        line.set({ x2: pointer.x, y2: pointer.y });
    }
    canvas.renderAll();
}

function handleMouseUp(e) {
    if (gameEnded) return;

    isDown = false;
    if (e.target === null) {
        line.remove();
    } else {
        if (!isValidLine(line)) {
            line.remove();
        }
    }
    const coordinatesForNewDots = removeSelectedDots(); 
    addNewDots(coordinatesForNewDots);
    console.log(coordinatesForNewDots);
}

// Game Logic
function handleLineCreation(target) {
    if (target.getFill() === line.getStroke() && isDown) {
        const centerPoint = target.getCenterPoint();
        line.set({ x2: centerPoint.x, y2: centerPoint.y });
        currentDot = target;

        if (!isValidLine(line, target)) {
            return;
        }

        createNewLine(centerPoint);
        updateGameState(target);

        if (target.getFill() === "#05006C") {
            connectedBlueDots++;
            updateDotsRemaining();
            checkWinCondition();
        }
    } else {
        currentDot = null;
    }
}

function isValidLine(line, target) {
    if (line.x2 !== line.x1 && line.y2 !== line.y1) {
        console.log("Diagonal lines are not allowed.");
        return false;
    }
    if (Math.abs(line.x2 - line.x1) > GRID_SIZE || Math.abs(line.y2 - line.y1) > GRID_SIZE) {
        console.log("Lines can only be one unit long");
        return false;
    }
    if (target.in) {
        console.log("Circle already has an input");
        return false;
    }
    if (target.id === selectedDots.tail.id) {
        console.log("Cannot move backwards.");
        return false;
    }
    return true;
}

function createNewLine(centerPoint) {
    lineExists = true;
    totalLines++;
    const points = [centerPoint.x, centerPoint.y, centerPoint.x, centerPoint.y];
    allLines[totalLines] = new fabric.Line(points, {
        strokeWidth: LINE_STROKE_WIDTH,
        stroke: activeLineColor,
        originX: 'center',
        originY: 'center'
    });
    line = allLines[totalLines];
    canvas.add(line);
}

function updateGameState(target) {
    target.in = true;
    selectedDots.add(target.id);
    console.log(selectedDots);
}

function updateDotsRemaining() {
    const dotsRemaining = TARGET_BLUE_DOTS - connectedBlueDots;
    dotsRemainingElement.textContent = dotsRemaining;
}

function checkWinCondition() {
    if (connectedBlueDots >= TARGET_BLUE_DOTS) {
        endGame(true);
    }
}

function startTimer() {
    let timeLeft = INITIAL_TIME;

    const timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft === 5) {
            timeElement.classList.add("blink");
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeElement.textContent = "0";
            timeElement.classList.remove("blink");
            endGame(false);
        } else {
            timeElement.textContent = timeLeft;
        }
    }, 1000);
}

function addNewDots(coordinatesForNewDots) {
    coordinatesForNewDots.forEach(coord => {
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
            stroke: 'rgba(0,0,0,0)',
            originX: 'left',
            originY: 'top',
            centeredRotation: true,
            selectable: false
        });
        canvas.add(dot);

        dot.animate({
            'opacity': '1',
            'top': dot.top + 20
        }, {
            duration: 950,
            onChange: canvas.renderAll.bind(canvas),
            easing: fabric.util.ease["easeOutElastic"]
        });
    });
}

function removeSelectedDots() {
    if (selectedDots._length <= 1) return [];

    const coordinatesForNewDots = [];

    canvas.forEachObject(obj => {
        if (obj.get('type') === "line") {
            animateAndRemove(obj);
            return;
        }

        let currentNode = selectedDots.head;
        for (let i = 0; i < selectedDots._length; i++) {
            if (currentNode.id === obj.id) {
                coordinatesForNewDots.push({
                    "x": obj.left,
                    "y": obj.top,
                    "id": obj.id
                });
                animateAndRemove(obj);
            }
            currentNode = currentNode.next;
        }
    });

    lineExists = false;
    selectedDots = new DoublyList();
    return coordinatesForNewDots;
}

function animateAndRemove(obj) {
    obj.animate('opacity', '0', {
        duration: 75,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: () => canvas.remove(obj)
    });
}

function endGame(won) {
    gameEnded = true;

    canvas.off('mouse:over');
    canvas.off('mouse:out');
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    
    const startTime = parseInt(timeElement.getAttribute('data-start-time'));
    const endTime = parseInt(timeElement.textContent);
    const timeTaken = startTime - endTime;

    let message;
    if (won) {
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
        message = "Game Over! Try again.";
    }

    alert(message);
}

// Utility Classes
function Node(value) {
    this.id = value;
    this.previous = null;
    this.next = null;
}

function DoublyList() {
    this._length = 0;
    this.head = null;
    this.tail = null;
}

DoublyList.prototype.add = function(value) {
    const node = new Node(value);
    if (this._length) {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;   
    } else {
        this.head = node;
        this.tail = node;
    }
    this._length++;
    return node;
};

function reloadPage() {
    location.reload();
}