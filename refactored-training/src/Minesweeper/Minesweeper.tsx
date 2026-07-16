import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

type Position = { r: number; c: number };

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

function getRandomBombCount(rows: number, cols: number): number {
  const totalTiles = rows * cols;
  const maxSafeMines = Math.max(1, totalTiles - 1);
  const minRecommended = Math.max(1, Math.floor(totalTiles * 0.12));
  const maxRecommended = Math.min(maxSafeMines, Math.max(minRecommended, Math.floor(totalTiles * 0.22)));
  return Math.floor(Math.random() * (maxRecommended - minRecommended + 1)) + minRecommended;
}

function Minesweeper() {
  const navigate = useNavigate();
  const motion = MOTION_DELAY_PRESETS[ACTIVE_MOTION_PRESET];
  const CUSTOM_DEFAULT_ROWS = 30;
  const CUSTOM_DEFAULT_COLS = 30;
  const CUSTOM_DEFAULT_MINES = 150;
  const TILE_GAP = 0;
  const BOARD_PADDING = 10;
  const TILE_MIN = 10;
  const TILE_MAX = 48;
  const TILE_READABLE_THRESHOLD = 18;
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [mines, setMines] = useState(10);
  const [draftRows, setDraftRows] = useState(CUSTOM_DEFAULT_ROWS);
  const [draftCols, setDraftCols] = useState(CUSTOM_DEFAULT_COLS);
  const [draftMines, setDraftMines] = useState(CUSTOM_DEFAULT_MINES);
  const [unknownBombCount, setUnknownBombCount] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const initialGame = generateBoard(8, 8, 10);
  const [boardState, setBoard] = useState<Board>(initialGame.board);
  const [preReveal, setPreReveal] = useState<PreReveal>(initialGame.preReveal);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [explodedBomb, setExplodedBomb] = useState<Position | null>(null);
  const [wrongFlags, setWrongFlags] = useState<{ r: number; c: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [boardAnimKey, setBoardAnimKey] = useState(0);
  const [boardViewport, setBoardViewport] = useState({ width: 0, height: 0 });
  const timerRef = useRef<number | null>(null);
  const boardFrameRef = useRef<HTMLDivElement | null>(null);
  const customBoardTooSmall = draftRows < 5 || draftCols < 5;

  function startNewGame(nextRows: number, nextCols: number, nextMines: number) {
    const { board, preReveal } = generateBoard(nextRows, nextCols, nextMines);
    setBoard(board);
    setPreReveal(preReveal);
    setGameOver(false);
    setWon(false);
    setShowEndOverlay(false);
    setExplodedBomb(null);
    setWrongFlags([]);
    setElapsed(0);
    setTimerActive(false);
    setBoardAnimKey(v => v + 1);
  }

  function applyPreset(nextRows: number, nextCols: number, nextMines: number) {
    setShowCustomize(false);
    setRows(nextRows);
    setCols(nextCols);
    setMines(nextMines);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setDraftMines(nextMines);
    startNewGame(nextRows, nextCols, nextMines);
  }

  const hasGameStarted = timerActive || elapsed > 0 || boardState.some(row => row.some(cell => cell.revealed || cell.flagged));

  function applyDraftSettings(overrides?: { rows?: number; cols?: number; mines?: number; unknownBombCount?: boolean }) {
    const proposedRows = overrides?.rows ?? draftRows;
    const proposedCols = overrides?.cols ?? draftCols;
    const proposedMines = overrides?.mines ?? draftMines;
    const useUnknownBombCount = overrides?.unknownBombCount ?? unknownBombCount;

    const nextRows = Math.max(0, Math.min(30, Number(proposedRows)));
    const nextCols = Math.max(0, Math.min(30, Number(proposedCols)));
    const draftMaxMines = Math.max(1, nextRows * nextCols - 1);
    const sanitizedDraftMines = Math.max(1, Math.min(draftMaxMines, Number(proposedMines)));

    if (nextRows < 5 || nextCols < 5) {
      setDraftRows(nextRows);
      setDraftCols(nextCols);
      setDraftMines(sanitizedDraftMines);
      setUnknownBombCount(useUnknownBombCount);
      return;
    }

    const maxMines = nextRows * nextCols - 1;
    const nextMines = useUnknownBombCount
      ? getRandomBombCount(nextRows, nextCols)
      : Math.max(1, Math.min(maxMines, Number(proposedMines)));

    if (!gameOver && hasGameStarted) {
      const shouldRestart = window.confirm('Start a new custom game with these settings? Your current progress will be lost.');
      if (!shouldRestart) {
        return;
      }
    }

    setRows(nextRows);
    setCols(nextCols);
    setMines(nextMines);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setDraftMines(nextMines);
    setUnknownBombCount(useUnknownBombCount);
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

  useEffect(() => {
    if (!boardFrameRef.current) return;

    const element = boardFrameRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setBoardViewport({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [rows, cols]);

  const computedTileSize = (() => {
    if (!boardViewport.width || !boardViewport.height) {
      return rows > 18 || cols > 18 ? 36 : 48;
    }

    const availableWidth = Math.max(0, boardViewport.width - BOARD_PADDING * 2);
    const availableHeight = Math.max(0, boardViewport.height - BOARD_PADDING * 2);
    const widthByCols = (availableWidth - TILE_GAP * (cols - 1)) / cols;
    const heightByRows = (availableHeight - TILE_GAP * (rows - 1)) / rows;
    const size = Math.floor(Math.min(widthByCols, heightByRows));

    return Math.max(TILE_MIN, Math.min(TILE_MAX, size));
  })();

  const tileFontSize = Math.max(10, Math.floor(computedTileSize * 0.52));
  const tileSizeConstrained = computedTileSize <= TILE_READABLE_THRESHOLD;

  function reveal(r: number, c: number) {
    if (gameOver) return;
    if (!timerActive) setTimerActive(true);
    const cell = boardState[r][c];
    // Chord: if already revealed, open all adjacent unopened, unflagged tiles in one batch
    if (cell.revealed) {
      const newBoard = cloneBoard(boardState);
      let bombTriggered = false;
      let triggeredBomb: Position | null = null;
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
                if (!triggeredBomb) {
                  triggeredBomb = { r: nr, c: nc };
                }
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
        setExplodedBomb(triggeredBomb);
        setTimerActive(false);
        setGameOver(true);
        setShowEndOverlay(true);
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
        setShowEndOverlay(true);
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
      setExplodedBomb({ r, c });
      setTimerActive(false);
      setGameOver(true);
      setShowEndOverlay(true);
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
      setShowEndOverlay(true);
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
      <header className={styles.headerBar}>
        <div>
          <h2>Minesweeper</h2>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.controlRail}>
          <button onClick={reset} className={styles.restartButton}>Restart</button>

          <section className={styles.panelCard}>
            <h3>Presets</h3>
            <div className={styles.presetGroup}>
              <button
                type="button"
                className={
                  styles.presetButton + (rows === 8 && cols === 8 && mines === 10 ? ' ' + styles.selectedButton : '')
                }
                onClick={() => applyPreset(8, 8, 10)}
              >
                Small
              </button>
              <button
                type="button"
                className={
                  styles.presetButton + (rows === 16 && cols === 16 && mines === 40 ? ' ' + styles.selectedButton : '')
                }
                onClick={() => applyPreset(16, 16, 40)}
              >
                Medium
              </button>
              <button
                type="button"
                className={
                  styles.presetButton + (rows === 16 && cols === 30 && mines === 99 ? ' ' + styles.selectedButton : '')
                }
                onClick={() => applyPreset(16, 30, 99)}
              >
                Large
              </button>
              <button
                type="button"
                className={
                  styles.presetButton +
                  (rows === CUSTOM_DEFAULT_ROWS && cols === CUSTOM_DEFAULT_COLS && mines === CUSTOM_DEFAULT_MINES
                    ? ' ' + styles.selectedButton
                    : '')
                }
                onClick={() => applyPreset(CUSTOM_DEFAULT_ROWS, CUSTOM_DEFAULT_COLS, CUSTOM_DEFAULT_MINES)}
              >
                Max
              </button>
              <button
                type="button"
                className={
                  styles.presetButton +
                  (showCustomize && rows === draftRows && cols === draftCols && mines === draftMines
                    ? ' ' + styles.selectedButton
                    : '')
                }
                onClick={() => {
                  setShowCustomize(true);
                  setUnknownBombCount(false);
                  applyDraftSettings({
                    rows: CUSTOM_DEFAULT_ROWS,
                    cols: CUSTOM_DEFAULT_COLS,
                    mines: CUSTOM_DEFAULT_MINES,
                    unknownBombCount: false,
                  });
                }}
              >
                Custom Game
              </button>
            </div>
          </section>

          {showCustomize && (
            <form
              className={styles.customForm}
              onSubmit={e => {
                e.preventDefault();
              }}
            >
              <label className={styles.customLabel}>
                Rows
                <input
                  className={styles.customInput}
                  type="number"
                  min={0}
                  max={30}
                  value={draftRows}
                  onChange={e => {
                    const nextRows = Math.max(0, Math.min(30, Number(e.target.value)));
                    applyDraftSettings({ rows: nextRows });
                  }}
                />
              </label>
              <label className={styles.customLabel}>
                Columns
                <input
                  className={styles.customInput}
                  type="number"
                  min={0}
                  max={30}
                  value={draftCols}
                  onChange={e => {
                    const nextCols = Math.max(0, Math.min(30, Number(e.target.value)));
                    applyDraftSettings({ cols: nextCols });
                  }}
                />
              </label>
              <label className={styles.customLabel}>
                Bombs
                <input
                  className={styles.customInput}
                  type={unknownBombCount ? 'text' : 'number'}
                  min={unknownBombCount ? undefined : 1}
                  max={unknownBombCount ? undefined : Math.max(1, draftRows * draftCols - 1)}
                  value={unknownBombCount ? '??' : draftMines}
                  disabled={unknownBombCount}
                  onChange={e => {
                    const maxMines = Math.max(1, draftRows * draftCols - 1);
                    const nextMines = Math.max(1, Math.min(maxMines, Number(e.target.value)));
                    applyDraftSettings({ mines: nextMines });
                  }}
                />
              </label>
              <label className={styles.customCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={unknownBombCount}
                  onChange={e => {
                    applyDraftSettings({ unknownBombCount: e.target.checked });
                  }}
                />
                Start with unknown number of bombs
              </label>
              {customBoardTooSmall && (
                <p className={styles.customValidationMessage}>Rows and columns lower than 5 are not possible.</p>
              )}
            </form>
          )}

          <section className={styles.panelCard + ' ' + styles.statusCard}>
            <h3>Round Status</h3>
            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Bombs Left</span>
                <span className={styles.statusValue}>💣 {unknownBombCount ? '??' : bombsLeft}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Time</span>
                <span className={styles.statusValue}>⏱ {elapsed}s</span>
              </div>
            </div>
            <p className={styles.instructions}>Right click to flag. Click revealed cells to chord nearby safe tiles.</p>
          </section>
        </aside>

        <section className={styles.boardStage}>
          <div className={styles.boardFrame} ref={boardFrameRef}>
            <div className={styles.boardWrapper} key={boardAnimKey} onContextMenu={e => e.preventDefault()}>
              {boardState.map((row, r) => (
                <div
                  key={r}
                  className={styles.boardRow}
                  style={{ animationDelay: `${Math.min(r * motion.mineRowStepMs, motion.mineRowMaxMs)}ms` }}
                >
                  {row.map((cell, c) => {
                    const isPreReveal = preReveal && preReveal.r === r && preReveal.c === c;
                    const isWrongFlag = wrongFlags.some(f => f.r === r && f.c === c);
                    const isExplodedBomb = explodedBomb?.r === r && explodedBomb?.c === c;
                    const tileDelay = Math.min(
                      r * motion.mineTileRowWeightMs + c * motion.mineTileColWeightMs,
                      motion.mineTileMaxMs
                    );
                    return (
                      <button
                        key={c}
                        className={
                          (cell.revealed ? styles.revealedTile : isPreReveal ? styles.preRevealTile : styles.tile) +
                          (isExplodedBomb ? ' ' + styles.explodedBombTile : '') +
                          (isWrongFlag ? ' ' + styles.wrongFlagTile : '')
                        }
                        style={{
                          width: computedTileSize,
                          height: computedTileSize,
                          fontSize: tileFontSize,
                          color: cell.mine
                            ? '#ff6b6b'
                            : isWrongFlag
                              ? '#ff4455'
                              : cell.adjacent === 1 ? '#5ba3ff'
                              : cell.adjacent === 2 ? '#4dcc7a'
                              : cell.adjacent === 3 ? '#ff6b6b'
                              : cell.adjacent === 4 ? '#a07bff'
                              : cell.adjacent === 5 ? '#ff9944'
                              : cell.adjacent === 6 ? '#44ddcc'
                              : cell.adjacent === 7 ? '#e0c06a'
                              : cell.adjacent === 8 ? '#aabbd0'
                              : '#c8daf5',
                          animationDelay: cell.revealed || isPreReveal ? `${tileDelay}ms` : undefined,
                        }}
                        data-tile-index={r * cols + c}
                        onClick={() => reveal(r, c)}
                        onContextMenu={e => flagCell(e, r, c)}
                        disabled={gameOver}
                      >
                        {cell.revealed
                          ? cell.mine
                            ? isExplodedBomb
                              ? '💥'
                              : '💣'
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
            {gameOver && showEndOverlay && (
              <div className={styles.endOverlay} role="dialog" aria-modal="true" aria-label="Game result">
                <div className={styles.endOverlayCard}>
                  <h3 className={styles.endOverlayTitle}>{won ? 'You Win!' : 'Game Over!'}</h3>
                  <p className={styles.endOverlaySubtitle}>
                    {won
                      ? `Solved in ${elapsed}s on a ${rows}x${cols} board with ${mines} mines.${unknownBombCount ? ` Hidden bomb count revealed: ${mines}.` : ''}`
                      : `A mine was triggered. Take a breath and run it back.${unknownBombCount ? ` This board had ${mines} bombs.` : ''}`}
                  </p>
                  <div className={styles.endOverlayActions}>
                    <button type="button" className={styles.overlayButton} onClick={() => setShowEndOverlay(false)}>
                      Go Back To Board
                    </button>
                    <button type="button" className={styles.overlayButtonPrimary} onClick={reset}>
                      New Game
                    </button>
                    <button type="button" className={styles.overlayButton} onClick={() => navigate('/leaderboard')}>
                      Go To Leaderboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {tileSizeConstrained && !gameOver && (
            <p className={styles.boardScaleHint}>
              Board is heavily scaled to fit. For easier play, reduce rows/columns or mine density.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Minesweeper;
