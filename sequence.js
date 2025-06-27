const board = [];
let currentPlayer = 'red';
let currentValue = { red: 4, blue: 4 };
const moveHistory = [];
const sequenceMap = { red: [], blue: [] };
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

  placeStart(0, 0, 1, 'red');
  placeStart(1, 1, 2, 'red');
  placeStart(2, 2, 3, 'red');

  placeStart(5, 5, 1, 'blue');
  placeStart(4, 4, 2, 'blue');
  placeStart(3, 3, 3, 'blue');

  sequenceMap.red = [
  { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } },
  { from: { row: 1, col: 1 }, to: { row: 2, col: 2 } }
];

sequenceMap.blue = [
  { from: { row: 5, col: 5 }, to: { row: 4, col: 4 } },
  { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } }
];

  drawPaths();
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

  if (selectedBase && highlightedCells.some(n => n.r === row && n.c === col)) {
    const newVal = selectedBase.value + 1;
    cell.value = newVal;
    cell.owner = currentPlayer;
    cell.el.textContent = newVal;
    cell.el.classList.add(currentPlayer);
   moveHistory.push({
  from: { row: selectedBase.row, col: selectedBase.col },
  to: { row, col },
  owner: currentPlayer,
  value: newVal
  });
  sequenceMap[currentPlayer].push({
  from: { row: selectedBase.row, col: selectedBase.col },
  to: { row, col }
  });
    selectedBase = null;
    clearHighlights();

    currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
    updateStatus();
    drawPaths();

    if (isBoardFull()) checkWinner();
    return;
  }

  clearHighlights();
  selectedBase = null;
}

function getValidEmptyNeighbors(r, c) {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
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
    statusP.textContent = `🎉 ${capitalize(winners[0])} wins by placing ${highest}(the highest number on the board)!`;
  } else {
    statusP.textContent = `🤝 It's a draw! Both placed ${highest}`;
  }

  board.flat().forEach(cell => cell.el.removeEventListener('click', handleClick));
}

function restartGame() {
  currentPlayer = 'red';
  currentValue = { red: 4, blue: 4 };
  moveHistory.length = 0;
  initBoard();
  updateStatus();
}

function undoMove() {
  const last = moveHistory.pop();
  if (!last) return;
  const cell = board[last.to.row][last.to.col];
  cell.value = 0;
  cell.owner = null;
  cell.el.textContent = '';
  cell.el.classList.remove('red', 'blue');
  sequenceMap[last.owner].pop();
  currentPlayer = last.owner;
  currentValue[currentPlayer]--;
  updateStatus();
  drawPaths();
}

function clearHighlights() {
  highlightedCells.forEach(({ r, c }) => {
    board[r][c].el.classList.remove('highlight');
  });
  highlightedCells = [];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function drawPaths() {
  const svg = document.getElementById('svgOverlay');
  svg.innerHTML = '';

  const offsetX = svg.getBoundingClientRect().left;
  const offsetY = svg.getBoundingClientRect().top;

  ['red', 'blue'].forEach(color => {
    const paths = sequenceMap[color];
    for (let i = 0; i < paths.length; i++) {
      const { from, to } = paths[i];

      const fromRect = board[from.row][from.col].el.getBoundingClientRect();
      const toRect = board[to.row][to.col].el.getBoundingClientRect();

      const x1 = fromRect.left + fromRect.width / 2 - offsetX;
      const y1 = fromRect.top + fromRect.height / 2 - offsetY;
      const x2 = toRect.left + toRect.width / 2 - offsetX;
      const y2 = toRect.top + toRect.height / 2 - offsetY;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-dasharray", "5,5");

      svg.appendChild(line);
    }
  });
}


window.onload = () => {
  initBoard();
  updateStatus();
};

function toggleRules() {
  const panel = document.getElementById('rulesPanel');
  panel.classList.toggle('hidden');
}


