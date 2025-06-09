import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import styles from './Minesweeper.module.css';

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

function generateBoard(rows: number, cols: number, mines: number): { board: Board; preReveal: PreReveal } {
  const board: Board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, adjacent: 0, flagged: false }))
  );
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c] = { ...board[r][c], mine: true };
      minesPlaced++;
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c] = { ...board[r][c], adjacent: count };
    }
  }
  // Pick a random free (adjacent === 0) non-mine tile for preReveal
  const freeTiles: { r: number; c: number }[] = [];
  const nonMineTiles: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

function Minesweeper() {
  // Add state for rows, cols, mines
  const [rows, setRows] = useState(8); // Default to Small
  const [cols, setCols] = useState(8); // Default to Small
  const [mines, setMines] = useState(10); // Default to Small
  const [showCustomize, setShowCustomize] = useState(false);

  // Board and preReveal state
  const [{ board, preReveal: initialPreReveal }, setInitialBoard] = useState(() => generateBoard(8, 8, 10));
  const [boardState, setBoard] = useState<Board>(board);
  const [preReveal, setPreReveal] = useState<PreReveal>(initialPreReveal);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [wrongFlags, setWrongFlags] = useState<{ r: number; c: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Regenerate board when settings change
  useEffect(() => {
    const { board, preReveal } = generateBoard(rows, cols, mines);
    setBoard(board);
    setPreReveal(preReveal);
    setGameOver(false);
    setWon(false);
    setWrongFlags([]);
    setElapsed(0);
    setInitialBoard({ board, preReveal });
  }, [rows, cols, mines]);

  // Count placed flags
  const flagCount = boardState.reduce((acc, row) => acc + row.filter(cell => cell.flagged).length, 0);
  const bombsLeft = mines - flagCount;

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
        rows,
        cols,
        mines,
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
  }, [won, elapsed, rows, cols, mines]);

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
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
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
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
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
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
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
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
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
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
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
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
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
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
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

  // Reset timer and board on restart
  function reset() {
    const { board, preReveal } = generateBoard(rows, cols, mines);
    setBoard(board);
    setPreReveal(preReveal);
    setGameOver(false);
    setWon(false);
    setWrongFlags([]);
    setElapsed(0);
    setInitialBoard({ board, preReveal });
  }

  return (
    <div className={styles.gameContainer}>
      <h2>Minesweeper</h2>
      {/* Customize button and conditional form */}
      <div className={styles.customizeButtonRow}>
        <button type="button" onClick={() => setShowCustomize(v => !v)} className={styles.customizeButton}>
          {showCustomize ? 'Hide Customization' : 'Customize Board'}
        </button>
        {/* Default size buttons */}
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 8 && cols === 8 && mines === 10 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => { setRows(8); setCols(8); setMines(10); reset(); }}
        >
          Small
        </button>
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 16 && cols === 16 && mines === 40 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => { setRows(16); setCols(16); setMines(40); reset(); }}
        >
          Medium
        </button>
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 16 && cols === 30 && mines === 99 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => { setRows(16); setCols(30); setMines(99); reset(); }}
        >
          Large
        </button>
      </div>
      {showCustomize && (
        <form
          style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}
          onSubmit={e => { e.preventDefault(); reset(); }}
        >
          <label>
            Rows:
            <input
              type="number"
              min={5}
              max={30}
              value={rows}
              onChange={e => setRows(Math.max(5, Math.min(30, Number(e.target.value))))}
              style={{ width: 48, marginLeft: 4 }}
            />
          </label>
          <label>
            Columns:
            <input
              type="number"
              min={5}
              max={30}
              value={cols}
              onChange={e => setCols(Math.max(5, Math.min(30, Number(e.target.value))))}
              style={{ width: 48, marginLeft: 4 }}
            />
          </label>
          <label>
            Mines:
            <input
              type="number"
              min={1}
              max={rows * cols - 1}
              value={mines}
              onChange={e => setMines(Math.max(1, Math.min(rows * cols - 1, Number(e.target.value))))}
              style={{ width: 56, marginLeft: 4 }}
            />
          </label>
          <button type="submit">Apply</button>
        </form>
      )}
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
                    className={
                      (cell.revealed ? styles.revealedTile : isPreReveal ? styles.preRevealTile : styles.tile) +
                      (isWrongFlag ? ' ' + styles.wrongFlagTile : '')
                    }
                    style={{
                      width: rows > 18 || cols > 18 ? 18 : 24,
                      height: rows > 18 || cols > 18 ? 18 : 24,
                      fontSize: 14,
                      color: cell.mine ? 'red' : isWrongFlag ? '#b00' : 'black',
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
        Left click to reveal. Right click to flag. {mines} mines on a {rows}x{cols} board.
      </p>
    </div>
  );
}

export default Minesweeper;
