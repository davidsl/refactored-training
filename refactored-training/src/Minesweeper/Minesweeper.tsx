import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import styles from './Minesweeper.module.css';
import { ACTIVE_MOTION_PRESET, MOTION_DELAY_PRESETS } from '../motionPreset';

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
  const motion = MOTION_DELAY_PRESETS[ACTIVE_MOTION_PRESET];
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [mines, setMines] = useState(10);
  const [draftRows, setDraftRows] = useState(8);
  const [draftCols, setDraftCols] = useState(8);
  const [draftMines, setDraftMines] = useState(10);
  const [showCustomize, setShowCustomize] = useState(false);

  const initialGame = generateBoard(8, 8, 10);
  const [boardState, setBoard] = useState<Board>(initialGame.board);
  const [preReveal, setPreReveal] = useState<PreReveal>(initialGame.preReveal);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [wrongFlags, setWrongFlags] = useState<{ r: number; c: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [boardAnimKey, setBoardAnimKey] = useState(0);
  const timerRef = useRef<number | null>(null);

  function startNewGame(nextRows: number, nextCols: number, nextMines: number) {
    const { board, preReveal } = generateBoard(nextRows, nextCols, nextMines);
    setBoard(board);
    setPreReveal(preReveal);
    setGameOver(false);
    setWon(false);
    setWrongFlags([]);
    setElapsed(0);
    setTimerActive(false);
    setBoardAnimKey(v => v + 1);
  }

  function applyPreset(nextRows: number, nextCols: number, nextMines: number) {
    setRows(nextRows);
    setCols(nextCols);
    setMines(nextMines);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setDraftMines(nextMines);
    startNewGame(nextRows, nextCols, nextMines);
  }

  function applyDraftSettings() {
    const nextRows = Math.max(5, Math.min(30, Number(draftRows)));
    const nextCols = Math.max(5, Math.min(30, Number(draftCols)));
    const maxMines = nextRows * nextCols - 1;
    const nextMines = Math.max(1, Math.min(maxMines, Number(draftMines)));

    setRows(nextRows);
    setCols(nextCols);
    setMines(nextMines);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setDraftMines(nextMines);
    startNewGame(nextRows, nextCols, nextMines);
  }

  // Count placed flags
  const flagCount = boardState.reduce((acc, row) => acc + row.filter(cell => cell.flagged).length, 0);
  const bombsLeft = mines - flagCount;

  // Start/stop timer based on timerActive and game state
  useEffect(() => {
    if (timerActive && !gameOver) {
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
  }, [timerActive, gameOver]);

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
    if (!timerActive) setTimerActive(true);
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
        setTimerActive(false);
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
        setTimerActive(false);
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
      setTimerActive(false);
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
      setTimerActive(false);
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

  function reset() {
    startNewGame(rows, cols, mines);
  }

  return (
    <div className={styles.gameContainer}>
      <h2>Minesweeper</h2>
      <div className={styles.customizeButtonRow}>
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 8 && cols === 8 && mines === 10 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => applyPreset(8, 8, 10)}
        >
          Small
        </button>
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 16 && cols === 16 && mines === 40 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => applyPreset(16, 16, 40)}
        >
          Medium
        </button>
        <button
          type="button"
          className={
            styles.customizeButton + (rows === 16 && cols === 30 && mines === 99 ? ' ' + styles.selectedButton : '')
          }
          onClick={() => applyPreset(16, 30, 99)}
        >
          Large
        </button>
        <button type="button" onClick={() => setShowCustomize(v => !v)} className={styles.customizeButton}>
          {showCustomize ? 'Hide Customization' : 'Customize Board'}
        </button>
      </div>
      {showCustomize && (
        <form
          className={styles.customForm}
          onSubmit={e => {
            e.preventDefault();
            applyDraftSettings();
          }}
        >
          <label className={styles.customLabel}>
            Rows:
            <input
              className={styles.customInput}
              type="number"
              min={5}
              max={30}
              value={draftRows}
              onChange={e => setDraftRows(Math.max(5, Math.min(30, Number(e.target.value))))}
            />
          </label>
          <label className={styles.customLabel}>
            Columns:
            <input
              className={styles.customInput}
              type="number"
              min={5}
              max={30}
              value={draftCols}
              onChange={e => setDraftCols(Math.max(5, Math.min(30, Number(e.target.value))))}
            />
          </label>
          <label className={styles.customLabel}>
            Mines:
            <input
              className={styles.customInput}
              type="number"
              min={1}
              max={Math.max(1, draftRows * draftCols - 1)}
              value={draftMines}
              onChange={e => {
                const maxMines = Math.max(1, draftRows * draftCols - 1);
                setDraftMines(Math.max(1, Math.min(maxMines, Number(e.target.value))));
              }}
            />
          </label>
          <button type="submit" className={styles.applyButton}>Apply</button>
        </form>
      )}
      <div className={styles.centerColumn}>
        <div className={styles.statusRow}>
          Bombs left: {bombsLeft} | Time: {elapsed}s
        </div>
        <button onClick={reset} className={styles.restartButton}>Restart</button>
        <div className={styles.boardWrapper} key={boardAnimKey}>
          {boardState.map((row, r) => (
            <div
              key={r}
              className={styles.boardRow}
              style={{ animationDelay: `${Math.min(r * motion.mineRowStepMs, motion.mineRowMaxMs)}ms` }}
            >
              {row.map((cell, c) => {
                const isPreReveal = preReveal && preReveal.r === r && preReveal.c === c;
                const isWrongFlag = wrongFlags.some(f => f.r === r && f.c === c);
                const tileDelay = Math.min(
                  r * motion.mineTileRowWeightMs + c * motion.mineTileColWeightMs,
                  motion.mineTileMaxMs
                );
                return (
                  <button
                    key={c}
                    className={
                      (cell.revealed ? styles.revealedTile : isPreReveal ? styles.preRevealTile : styles.tile) +
                      (isWrongFlag ? ' ' + styles.wrongFlagTile : '')
                    }
                    style={{
                      width: rows > 18 || cols > 18 ? 36 : 48,
                      height: rows > 18 || cols > 18 ? 36 : 48,
                      fontSize: 24,
                      color: cell.mine ? 'red' : isWrongFlag ? '#b00' : 'black',
                      animationDelay: cell.revealed || isPreReveal ? `${tileDelay}ms` : undefined,
                    }}
                    data-tile-index={r * cols + c}
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
        <div className={styles.gameOverMsg} style={{ color: won ? '#0f8e5f' : '#cc3040' }}>
          {won ? 'You Win!' : 'Game Over!'}
        </div>
      )}
    </div>
  );
}

export default Minesweeper;
