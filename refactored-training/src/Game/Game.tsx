import { useState } from 'react';
import type { MouseEvent } from 'react';
import styles from './Game.module.css';

const ROWS = 5;
const COLS = 5;
const MINES = 4;

type Cell = {
  mine: boolean;
  revealed: boolean;
  adjacent: number;
  flagged: boolean;
};

type Board = Cell[][];

function generateBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, adjacent: 0, flagged: false }))
  );
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) {
      board[r][c] = { ...board[r][c], mine: true };
      minesPlaced++;
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
        }
      }
      board[r][c] = { ...board[r][c], adjacent: count };
    }
  }
  return board;
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })));
}

function Game() {
  const [board, setBoard] = useState<Board>(() => generateBoard());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  function reveal(r: number, c: number) {
    if (gameOver || board[r][c].revealed || board[r][c].flagged) return;
    const newBoard = cloneBoard(board);
    function flood(row: number, col: number) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      if (newBoard[row][col].revealed || newBoard[row][col].flagged) return;
      newBoard[row][col].revealed = true;
      if (newBoard[row][col].adjacent === 0 && !newBoard[row][col].mine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) flood(row + dr, col + dc);
          }
        }
      }
    }
    if (newBoard[r][c].mine) {
      newBoard[r][c].revealed = true;
      setBoard(newBoard);
      setGameOver(true);
      return;
    }
    flood(r, c);
    setBoard(newBoard);
    let allRevealed = true;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newBoard[row][col].mine && !newBoard[row][col].revealed) allRevealed = false;
      }
    }
    if (allRevealed) {
      setGameOver(true);
      setWon(true);
    }
  }

  function flagCell(e: MouseEvent<HTMLButtonElement>, r: number, c: number) {
    e.preventDefault();
    if (gameOver || board[r][c].revealed) return;
    const newBoard = cloneBoard(board);
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
  }

  function reset() {
    setBoard(generateBoard());
    setGameOver(false);
    setWon(false);
  }

  return (
    <div className={styles.gameContainer}>
      <h2>Minesweeper</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button onClick={reset} style={{ marginBottom: 10 }}>Restart</button>
        <div style={{ display: 'inline-block' }}>
          {board.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => (
                <button
                  key={c}
                  className={cell.revealed ? styles.revealedTile : ''}
                  style={{
                    width: 32,
                    height: 32,
                    fontWeight: 'bold',
                    fontSize: 18,
                    background: cell.revealed ? '#eee' : '#bbb',
                    border: '1px solid #888',
                    cursor: gameOver ? 'not-allowed' : 'pointer',
                    color: cell.mine ? 'red' : 'black',
                    padding: 0,
                  }}
                  onClick={() => reveal(r, c)}
                  onContextMenu={e => flagCell(e, r, c)}
                  disabled={gameOver}
                >
                  {cell.revealed
                    ? cell.mine
                      ? '💣'
                      : cell.adjacent > 0
                        ? cell.adjacent
                        : ''
                    : cell.flagged
                      ? '🚩'
                      : ''}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {gameOver && (
        <div style={{ marginTop: 10, fontWeight: 'bold', color: won ? 'green' : 'red' }}>
          {won ? 'You Win!' : 'Game Over!'}
        </div>
      )}
      <p style={{marginTop: 10, fontSize: 12}}>
        Left click to reveal. Right click to flag. {MINES} mines on a {ROWS}x{COLS} board.
      </p>
    </div>
  );
}

export default Game;
