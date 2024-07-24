// Game state variables and utility classes
import { LEVELS } from "./config.js";

export const state = {
    currentLevel: 1,
    canvas: null,
    selectedDots: new DoublyList(),
    currentDot: null,
    line: null,
    isDown: false,
    lineExists: false,
    totalLines: 0,
    activeLineColor: "#000",
    allLines: [],
    connectedBlueDots: 0,
    gameEnded: false,
    timeElement: null,
    dotsRemainingElement: null
};

// gameState.js
export function resetState() {
    state.selectedDots = new DoublyList();
    state.currentDot = null;
    state.line = null;
    state.isDown = false;
    state.lineExists = false;
    state.totalLines = 0;
    state.activeLineColor = "#000";
    state.allLines = [];
    state.connectedBlueDots = 0;
    state.gameEnded = false;
    state.currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    // Do not reset timeElement or dotsRemainingElement here
}

export function updateCurrentLevel(level) {
    state.currentLevel = level;
    // Only store in localStorage if the player hasn't completed all levels
    if (level <= LEVELS.length) {
        localStorage.setItem('currentLevel', level);
    } else {
        localStorage.removeItem('currentLevel');  // Clear stored level if all levels are completed
    }
}

// Utility classes
export function Node(value) {
    this.id = value;
    this.previous = null;
    this.next = null;
}

export function DoublyList() {
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