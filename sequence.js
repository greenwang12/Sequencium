const board = [];
let currentPlayer = 'red';
let currentValue = { red: 4, blue: 4 };
const moveHistory = []; // keeps track of previous moves
let selectedBase = null;
let highlightedCells = [];



const statusP = document.getElementById('status');
const gameBoard = document.getElementById('gameBoard');

function initBoard() {
  gameBoard.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    board[i] = [];
    for (let j = 0; j < 6; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      board[i][j] = { el: cell, value: 0, owner: null };
      cell.addEventListener('click', handleClick);
      gameBoard.appendChild(cell);
    }
  }

  // Initial numbers
  placeStart(0, 0, 1, 'red');
  placeStart(1, 1, 2, 'red');
  placeStart(2, 2, 3, 'red');

  placeStart(5, 5, 1, 'blue');
  placeStart(4, 4, 2, 'blue');
  placeStart(3, 3, 3, 'blue');
}

function placeStart(row, col, val, owner) {
  const cell = board[row][col];
  cell.value = val;
  cell.owner = owner;
  cell.el.textContent = val;
  cell.el.classList.add(owner);
}

function handleClick(e) {
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);
  const cell = board[row][col];

  // If player clicks their own number, start selection
  if (cell.owner === currentPlayer) {
    clearHighlights();
    selectedBase = { row, col, value: cell.value };
    const neighbors = getValidEmptyNeighbors(row, col);

    neighbors.forEach(n => {
      const nCell = board[n.r][n.c];
      nCell.el.classList.add('highlight');
      highlightedCells.push(n);
    });
    return;
  }

  // If already selected and player clicks on a highlighted neighbor
  if (selectedBase && highlightedCells.some(n => n.r === row && n.c === col)) {
    const newVal = selectedBase.value + 1;
    cell.value = newVal;
    cell.owner = currentPlayer;
   cell.el.textContent = newVal;
   cell.el.classList.add('arrow-cell'); // new class to apply dashed arrow
    cell.el.classList.add(currentPlayer);
    moveHistory.push({ row, col, owner: currentPlayer, value: newVal });

    selectedBase = null;
    clearHighlights();

    currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
    updateStatus();

    if (isBoardFull()) checkWinner();
    return;
  }

  // Otherwise, invalid click — just reset
  clearHighlights();
  selectedBase = null;
}


function getNeighbors(r, c) {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],     // orthogonal
    [-1, -1], [-1, 1], [1, -1], [1, 1]    // diagonals
  ];
  return dirs.map(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    return board[nr]?.[nc] || {};
  });
}

function getValidEmptyNeighbors(r, c) {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],     // orthogonal
    [-1, -1], [-1, 1], [1, -1], [1, 1]    // diagonals
  ];
  return dirs
    .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
    .filter(pos => {
      const cell = board[pos.r]?.[pos.c];
      return cell && cell.value === 0;
    });
}

function updateStatus() {
  statusP.textContent = `${capitalize(currentPlayer)}'s turn: Place a successor`;
}

function isBoardFull() {
  return board.flat().every(cell => cell.value !== 0);
}

function checkWinner() {
  let highest = 0;
  let winners = [];

  board.flat().forEach(cell => {
    if (cell.value > highest) {
      highest = cell.value;
      winners = [cell.owner];
    } else if (cell.value === highest && !winners.includes(cell.owner)) {
      winners.push(cell.owner);
    }
  });

  if (winners.length === 1) {
    statusP.textContent = `🎉 ${capitalize(winners[0])} wins by placing ${highest}!`;
  } else {
    statusP.textContent = `🤝 It's a draw! Both placed ${highest}`;
  }

  // Disable further clicking
  board.flat().forEach(cell => cell.el.removeEventListener('click', handleClick));
}

function restartGame() {
  currentPlayer = 'red';
  currentValue = { red: 4, blue: 4 };
  initBoard();
  updateStatus();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

window.onload = () => {
  initBoard();
  updateStatus();
};

function undoMove() {
  const last = moveHistory.pop();
  if (!last) return;

  const cell = board[last.row][last.col];
  cell.value = 0;
  cell.owner = null;
  cell.el.textContent = '';
  cell.el.classList.remove('red', 'blue');

  // Undo value increment
  currentPlayer = last.owner;
  currentValue[currentPlayer]--;

  updateStatus();
}

function clearHighlights() {
  highlightedCells.forEach(({ r, c }) => {
    board[r][c].el.classList.remove('highlight');
  });
  highlightedCells = [];
}
