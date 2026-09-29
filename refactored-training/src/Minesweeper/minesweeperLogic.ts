export type Cell = {
  mine: boolean;
  revealed: boolean;
  adjacent: number;
  flagged: boolean;
};

export type Board = Cell[][];
export type Position = { r: number; c: number };
export type PreReveal = Position | null;
export type GameOutcome = 'playing' | 'won' | 'lost';
export type CustomBoardValidationError = 'dimensions' | 'mines' | null;

export const MIN_CUSTOM_DIMENSION = 5;
export const MAX_CUSTOM_ROWS = 50;
export const MAX_CUSTOM_COLS = 30;

export function generateBoard(
  rows: number,
  cols: number,
  mines: number,
  random: () => number = Math.random
): { board: Board; preReveal: PreReveal } {
  const totalTiles = rows * cols;
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(cols) || cols < 1) {
    throw new RangeError('Board dimensions must be positive integers.');
  }
  if (!Number.isInteger(mines) || mines < 0 || mines >= totalTiles) {
    throw new RangeError('Mine count must be a non-negative integer smaller than the board.');
  }

  const board: Board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, adjacent: 0, flagged: false }))
  );
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const rowIndex = Math.floor(random() * rows);
    const columnIndex = Math.floor(random() * cols);
    if (!board[rowIndex][columnIndex].mine) {
      board[rowIndex][columnIndex] = { ...board[rowIndex][columnIndex], mine: true };
      minesPlaced++;
    }
  }

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let columnIndex = 0; columnIndex < cols; columnIndex++) {
      if (board[rowIndex][columnIndex].mine) continue;
      let adjacentMines = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
          if (rowOffset === 0 && columnOffset === 0) continue;
          const neighborRow = rowIndex + rowOffset;
          const neighborColumn = columnIndex + columnOffset;
          if (
            neighborRow >= 0 && neighborRow < rows &&
            neighborColumn >= 0 && neighborColumn < cols &&
            board[neighborRow][neighborColumn].mine
          ) {
            adjacentMines++;
          }
        }
      }
      board[rowIndex][columnIndex] = { ...board[rowIndex][columnIndex], adjacent: adjacentMines };
    }
  }

  const zeroMineTiles: Position[] = [];
  const safeTiles: Position[] = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let columnIndex = 0; columnIndex < cols; columnIndex++) {
      const cell = board[rowIndex][columnIndex];
      if (!cell.mine) {
        safeTiles.push({ r: rowIndex, c: columnIndex });
        if (cell.adjacent === 0) zeroMineTiles.push({ r: rowIndex, c: columnIndex });
      }
    }
  }

  const preRevealCandidates = zeroMineTiles.length > 0 ? zeroMineTiles : safeTiles;
  const preReveal = preRevealCandidates.length > 0
    ? preRevealCandidates[Math.floor(random() * preRevealCandidates.length)]
    : null;

  return { board, preReveal };
}

export function getGameOutcome(board: Board, detonatedMine = false): GameOutcome {
  if (detonatedMine) return 'lost';
  if (board.length === 0 || board.some(row => row.length === 0)) return 'playing';
  if (!board.some(row => row.some(cell => !cell.mine))) return 'playing';

  const allSafeCellsRevealed = board.every(row => row.every(cell => cell.mine || cell.revealed));
  return allSafeCellsRevealed ? 'won' : 'playing';
}

export function calculateScore(rows: number, cols: number, mines: number, elapsed: number, won: boolean): number {
  if (!won) return 0;
  const cells = rows * cols;
  if (cells <= 0) return 0;
  const mineDensity = mines / cells;
  return Math.max(0, Math.round(cells * 12 * (1 + 2.5 * Math.sqrt(mineDensity)) - elapsed * 3));
}

export function getCustomBoardValidationError(
  rows: number,
  cols: number,
  mines: number
): CustomBoardValidationError {
  if (
    !Number.isInteger(rows) || rows < MIN_CUSTOM_DIMENSION || rows > MAX_CUSTOM_ROWS ||
    !Number.isInteger(cols) || cols < MIN_CUSTOM_DIMENSION || cols > MAX_CUSTOM_COLS
  ) {
    return 'dimensions';
  }
  if (!Number.isInteger(mines) || mines < 1 || mines >= rows * cols) return 'mines';
  return null;
}