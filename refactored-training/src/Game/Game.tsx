import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import styles from './Game.module.css';

const ROWS = 10;
const COLS = 10;
const MINES = 12;

type Cell = {
  mine: boolean;
  revealed: boolean;
  adjacent: number;
  flagged: boolean;
};

type Board = Cell[][];

type PreReveal = { r: number; c: number } | null;

type WinRecord = {
  rows: number;
  cols: number;
  mines: number;
  time: number;
  date: string;
};

function generateBoard(): { board: Board; preReveal: PreReveal } {
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
  // Pick a random free (adjacent === 0) non-mine tile for preReveal
  const freeTiles: { r: number; c: number }[] = [];
  const nonMineTiles: { r: number; c: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].mine) {
        nonMineTiles.push({ r, c });
        if (board[r][c].adjacent === 0) {
          freeTiles.push({ r, c });
        }
      }
    }
  }
  let preReveal: PreReveal = null;
  if (freeTiles.length > 0) {
    preReveal = freeTiles[Math.floor(Math.random() * freeTiles.length)];
  } else if (nonMineTiles.length > 0) {
    preReveal = nonMineTiles[Math.floor(Math.random() * nonMineTiles.length)];
  }
  return { board, preReveal };
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })));
}

function Game() {
  const [{ board, preReveal: initialPreReveal }] = useState(() => generateBoard());
  const [boardState, setBoard] = useState<Board>(board);
  const [preReveal, setPreReveal] = useState<PreReveal>(initialPreReveal);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [wrongFlags, setWrongFlags] = useState<{ r: number; c: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Count placed flags
  const flagCount = boardState.reduce((acc, row) => acc + row.filter(cell => cell.flagged).length, 0);
  const bombsLeft = MINES - flagCount;

  // Start/stop timer based on game state
  useEffect(() => {
    if (!gameOver) {
      timerRef.current = window.setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameOver]);

  useEffect(() => {
    if (won) {
      // Save win to sessionStorage
      const winRecord = {
        rows: ROWS,
        cols: COLS,
        mines: MINES,
        time: elapsed,
        date: new Date().toISOString(),
      };
      const prev = sessionStorage.getItem('minesweeperWins');
      let wins: WinRecord[] = [];
      if (prev) {
        try {
          wins = JSON.parse(prev);
        } catch { /* ignore parse error */ }
      }
      wins.push(winRecord);
      sessionStorage.setItem('minesweeperWins', JSON.stringify(wins));
    }
  }, [won, elapsed]);

  function reveal(r: number, c: number) {
    if (gameOver) return;
    const cell = boardState[r][c];
    // Chord: if already revealed, open all adjacent unopened, unflagged tiles in one batch
    if (cell.revealed) {
      const newBoard = cloneBoard(boardState);
      let bombTriggered = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            const neighbor = newBoard[nr][nc];
            if (!neighbor.revealed && !neighbor.flagged) {
              if (neighbor.mine) {
                neighbor.revealed = true;
                bombTriggered = true;
              } else if (neighbor.adjacent === 0) {
                floodReveal(newBoard, nr, nc);
              } else {
                neighbor.revealed = true;
              }
            }
          }
        }
      }
      if (bombTriggered) {
        // Reveal all bombs and wrong flags, as in direct bomb click
        const wrongs: { r: number; c: number }[] = [];
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            if (newBoard[row][col].flagged && !newBoard[row][col].mine) {
              newBoard[row][col].revealed = true;
              wrongs.push({ r: row, c: col });
            }
            if (newBoard[row][col].mine && !newBoard[row][col].flagged) {
              newBoard[row][col].revealed = true;
            }
          }
        }
        setBoard(newBoard);
        setWrongFlags(wrongs);
        setGameOver(true);
        return;
      }
      setBoard(newBoard);
      // Check win condition
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
      return;
    }
    if (cell.revealed || cell.flagged) return;
    // If this is the pre-revealed tile, clear the preReveal marker
    if (preReveal && preReveal.r === r && preReveal.c === c) {
      setPreReveal(null);
    }
    const newBoard = cloneBoard(boardState);
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
    function floodReveal(board: Board, row: number, col: number) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      if (board[row][col].revealed || board[row][col].flagged) return;
      board[row][col].revealed = true;
      if (board[row][col].adjacent === 0 && !board[row][col].mine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) floodReveal(board, row + dr, col + dc);
          }
        }
      }
    }
    if (newBoard[r][c].mine) {
      newBoard[r][c].revealed = true;
      // Mark all wrongly placed flags and reveal all bombs (except correctly flagged ones)
      const wrongs: { r: number; c: number }[] = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (newBoard[row][col].flagged && !newBoard[row][col].mine) {
            newBoard[row][col].revealed = true;
            wrongs.push({ r: row, c: col });
          }
          // Reveal bombs only if not flagged
          if (newBoard[row][col].mine && !newBoard[row][col].flagged) {
            newBoard[row][col].revealed = true;
          }
        }
      }
      setBoard(newBoard);
      setWrongFlags(wrongs);
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
    if (gameOver || boardState[r][c].revealed) return;
    const newBoard = cloneBoard(boardState);
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
  }

  // Reset timer on restart
  function reset() {
    const { board, preReveal } = generateBoard();
    setBoard(board);
    setPreReveal(preReveal);
    setGameOver(false);
    setWon(false);
    setWrongFlags([]);
    setElapsed(0);
  }

  return (
    <div className={styles.gameContainer}>
      <h2>Minesweeper</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {/* Tab button removed, only Game UI remains */}
      </div>
      {/* Only show the game UI, no tab switching */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 6, fontWeight: 'bold', fontSize: 16 }}>
          Bombs left: {bombsLeft} | Time: {elapsed}s
        </div>
        <button onClick={reset} style={{ marginBottom: 10 }}>Restart</button>
        <div style={{ display: 'inline-block' }}>
          {boardState.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => {
                const isPreReveal = preReveal && preReveal.r === r && preReveal.c === c;
                const isWrongFlag = wrongFlags.some(f => f.r === r && f.c === c);
                return (
                  <button
                    key={c}
                    className={cell.revealed ? styles.revealedTile : isPreReveal ? styles.preRevealTile : ''}
                    style={{
                      width: 24,
                      height: 24,
                      fontWeight: 'bold',
                      fontSize: 14,
                      background: cell.revealed ? (isWrongFlag ? '#ffcccc' : '#eee') : isPreReveal ? '#cceeff' : '#bbb',
                      border: isPreReveal ? '2px solid #3399cc' : '1px solid #888',
                      cursor: gameOver ? 'not-allowed' : 'pointer',
                      color: cell.mine ? 'red' : isWrongFlag ? '#b00' : 'black',
                      padding: 0,
                    }}
                    onClick={() => reveal(r, c)}
                    onContextMenu={e => flagCell(e, r, c)}
                    disabled={gameOver}
                  >
                    {cell.revealed
                      ? cell.mine
                        ? '💣'
                        : isWrongFlag
                          ? '❌'
                          : cell.adjacent > 0
                            ? cell.adjacent
                            : ''
                      : cell.flagged
                        ? '🚩'
                        : ''}
                  </button>
                );
              })}
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
