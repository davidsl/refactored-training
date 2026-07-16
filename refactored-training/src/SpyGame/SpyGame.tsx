import { type CSSProperties, useEffect, useState } from 'react';
import styles from './SpyGame.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPY_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown'] as const;
type SpyColor = (typeof SPY_COLORS)[number];

const HEX: Record<SpyColor, string> = {
  red: '#c0392b',
  blue: '#2980b9',
  green: '#27ae60',
  yellow: '#c8a000',
  orange: '#ca6f1e',
  purple: '#7d3c98',
  brown: '#6d4c41',
};

const NUM_SPACES = 12;
const DEFAULT_GOAL = 42;

// Point value of each space on the board (no nulls — Treasure is a movable marker)
const SPACE_VAL: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -3];

// Grid positions (row, col) for each space — clockwise around a 4×4 perimeter
const GRID_POS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3],  // spaces 0–3: top row →
  [1, 3], [2, 3],                    // spaces 4–5: right col ↓
  [3, 3], [3, 2], [3, 1], [3, 0],  // spaces 6–9: bottom row ←
  [2, 0], [1, 0],                    // spaces 10–11: left col ↑
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'play' | 'scoring' | 'chooseTreasure' | 'guess' | 'over';

interface Player {
  id: number;
  name: string;
  secret: SpyColor;
  guessBoard: Partial<Record<SpyColor, GuessOccupant>>;
}

type GuessOccupant =
  | { kind: 'player'; playerId: number }
  | { kind: 'dummy'; dummyId: number };

interface Delta {
  c: SpyColor;
  d: number;
  to: number;
}

interface G {
  phase: Phase;
  players: Player[];
  targetGoal: number;
  guessBoard: Partial<Record<SpyColor, GuessOccupant>>;
  pos: Record<SpyColor, number>;
  score: Record<SpyColor, number>;
  safePos: number;
  cur: number;
  die: number | null;
  left: number;
  deltas: Delta[] | null;
  animFrom: Record<SpyColor, number> | null;
  guesser: number;
  endFlag: boolean;
}

// ─── State helpers ────────────────────────────────────────────────────────────

function mkPos(): Record<SpyColor, number> {
  return Object.fromEntries(SPY_COLORS.map(c => [c, 0])) as Record<SpyColor, number>;
}

function mkScore(): Record<SpyColor, number> {
  return Object.fromEntries(SPY_COLORS.map(c => [c, 0])) as Record<SpyColor, number>;
}

function TreasureIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      role="img"
      aria-label="Treasure"
    >
      <path d="M12 2L21 10L12 22L3 10L12 2Z" />
      <path d="M12 2L16 10L12 22L8 10L12 2Z" />
      <path d="M3 10H21" />
    </svg>
  );
}

function SpyTokenIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label="Spy token">
      <path d="M5 10H19L17.2 7.4H6.8L5 10Z" />
      <circle cx="12" cy="12.3" r="3.3" />
      <path d="M7.1 18.5C8.1 16.1 9.8 14.8 12 14.8C14.2 14.8 15.9 16.1 16.9 18.5H7.1Z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpyGame() {
  const [np, setNp] = useState(2);
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [targetGoal, setTargetGoal] = useState(DEFAULT_GOAL);
  const [g, setG] = useState<G | null>(null);
  const [showSec, setShowSec] = useState(false);
  const [showCorrectGuesses, setShowCorrectGuesses] = useState(false);
  const [dragSpy, setDragSpy] = useState<SpyColor | null>(null);
  const [dragGuessToken, setDragGuessToken] = useState<GuessOccupant | null>(null);
  const [draggingOver, setDraggingOver] = useState<number | null>(null);
  const [animScores, setAnimScores] = useState<Record<SpyColor, number> | null>(null);
  const [showLastDeltas, setShowLastDeltas] = useState(false);

  useEffect(() => {
    if (g?.phase !== 'scoring' || !g.animFrom) return;
    const from = g.animFrom;
    const to = g.score;
    const DURATION = 2200;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / DURATION, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setAnimScores(Object.fromEntries(
        SPY_COLORS.map(c => [c, Math.round(from[c] + (to[c] - from[c]) * ease)])
      ) as Record<SpyColor, number>);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setAnimScores(null);
          setShowSec(false);
          setG(prev => {
            if (!prev || prev.phase !== 'scoring') return prev;
            if (prev.endFlag) return { ...prev, phase: 'guess' as Phase, guesser: 0, animFrom: null };
            return { ...prev, phase: 'play' as Phase, cur: (prev.cur + 1) % prev.players.length, animFrom: null };
          });
        }, 500);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [g?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleCountChange(n: number) {
    setNp(n);
  }

  function handleNameChange(i: number, val: string) {
    setNames(prev => { const a = [...prev]; a[i] = val; return a; });
  }

  function startGame() {
    const colors = [...SPY_COLORS].sort(() => Math.random() - 0.5).slice(0, np);
    const players: Player[] = names.slice(0, np).map((n, i) => ({
      id: i,
      name: n.trim() || `Player ${i + 1}`,
      secret: colors[i],
      guessBoard: {},
    }));
    setG({
      phase: 'play', players,
      targetGoal,
      guessBoard: {},
      pos: mkPos(), score: mkScore(),
      safePos: 7,
      cur: 0, die: null, left: 0,
      deltas: null, animFrom: null, guesser: 0, endFlag: false,
    });
    setShowSec(false);
  }

  function roll() {
    const r = 1 + Math.floor(Math.random() * 6);
    setG(prev => prev ? { ...prev, die: r, left: r } : prev);
  }

  function pickSpy(c: SpyColor) {
    setG(prev => {
      if (!prev || prev.die === null || prev.left <= 0) return prev;
      const pos = { ...prev.pos };
      pos[c] = (pos[c] + 1) % NUM_SPACES;
      return { ...prev, pos, left: prev.left - 1 };
    });
  }

  function handleTileDrop(tileIdx: number) {
    if (!dragSpy) return;
    const spy = dragSpy;
    setDragSpy(null);
    setDraggingOver(null);
    setG(prev => {
      if (!prev) return prev;
      const steps = (tileIdx - prev.pos[spy] + NUM_SPACES) % NUM_SPACES;
      if (steps < 1 || steps > prev.left) return prev;
      const pos = { ...prev.pos, [spy]: tileIdx };
      return { ...prev, pos, left: prev.left - steps };
    });
  }

  function endTurn() {
    setG(prev => {
      if (!prev) return prev;
      const onSafe = SPY_COLORS.some(c => prev.pos[c] === prev.safePos);

      if (onSafe) {
        const score = { ...prev.score };
        const deltas: Delta[] = SPY_COLORS.map(c => {
          const d = SPACE_VAL[prev.pos[c]];
          score[c] += d;
          return { c, d, to: score[c] };
        });
        const endFlag = Object.values(score).some(s => s >= prev.targetGoal);
        return {
          ...prev, score,
          phase: endFlag ? ('guess' as Phase) : ('chooseTreasure' as Phase), deltas,
          animFrom: prev.score,
          guesser: endFlag ? 0 : prev.guesser,
          die: null, left: 0,
          endFlag,
        };
      }

      return {
        ...prev, die: null, left: 0,
        phase: 'play' as Phase,
        cur: (prev.cur + 1) % prev.players.length,
      };
    });
    setShowSec(false);
  }

  function chooseTreasureLocation(tileIdx: number) {
    setG(prev => {
      if (!prev || prev.phase !== 'chooseTreasure') return prev;
      const occupied = new Set(Object.values(prev.pos));
      if (occupied.has(tileIdx)) return prev;
      if (prev.endFlag) return { ...prev, safePos: tileIdx, phase: 'guess' as Phase, guesser: 0, animFrom: null };
      return { ...prev, safePos: tileIdx, phase: 'play' as Phase, cur: (prev.cur + 1) % prev.players.length, animFrom: null };
    });
  }

  function placeGuess(color: SpyColor, occupant: GuessOccupant) {
    setG(prev => {
      if (!prev) return prev;
      const nextBoard: Partial<Record<SpyColor, GuessOccupant>> = {};
      for (const [slot, placed] of Object.entries(prev.guessBoard) as Array<[SpyColor, GuessOccupant | undefined]>) {
        if (!placed) continue;
        if (placed.kind === occupant.kind) {
          if (placed.kind === 'player' && occupant.kind === 'player' && placed.playerId === occupant.playerId) continue;
          if (placed.kind === 'dummy' && occupant.kind === 'dummy' && placed.dummyId === occupant.dummyId) continue;
        }
        if (placed.kind === 'player' && occupant.kind === 'player' && placed.playerId === occupant.playerId) continue;
        if (placed.kind === 'dummy' && occupant.kind === 'dummy' && placed.dummyId === occupant.dummyId) continue;
        nextBoard[slot] = placed;
      }
      nextBoard[color] = occupant;
      return { ...prev, guessBoard: nextBoard };
    });
    setDragGuessToken(null);
  }

  function submitGuess() {
    setG(prev => {
      if (!prev) return prev;
      const players = prev.players.map((player, index) => (
        index === prev.guesser ? { ...player, guessBoard: prev.guessBoard } : player
      ));

      if (prev.guesser < prev.players.length - 1) {
        return { ...prev, players, guesser: prev.guesser + 1, guessBoard: {} };
      }

      const score = { ...prev.score };
      for (const player of players) {
        const guess = Object.entries(player.guessBoard).find(([, occupant]) => occupant?.kind === 'player' && occupant.playerId === player.id)?.[0] as SpyColor | undefined;
        if (guess === player.secret) {
          score[player.secret] += 5;
        }
      }
      return { ...prev, players, phase: 'over' as Phase, score };
    });
  }

  // ── Setup screen ─────────────────────────────────────────────────────────────

  if (!g) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>🕵️</div>
          <h1 className={styles.title}>Top Secret Spies</h1>
          <p className={styles.sub}>Heimlich &amp; Co. &bull; 1984 &bull; Spiel des Jahres 1986</p>
        </div>
        <div className={styles.setup}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Players</span>
            <div className={styles.numBtns}>
              {([2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  className={`${styles.numBtn} ${np === n ? styles.numBtnActive : ''}`}
                  onClick={() => handleCountChange(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Goal</span>
            <input
              className={`${styles.nameInput} ${styles.goalInput}`}
              type="number"
              min={1}
              step={1}
              value={targetGoal}
              onChange={e => {
                const next = Number(e.target.value);
                setTargetGoal(Number.isFinite(next) && next > 0 ? Math.floor(next) : DEFAULT_GOAL);
              }}
            />
          </div>
          <div className={styles.nameFields}>
            {Array.from({ length: np }).map((_, i) => (
              <input
                key={i}
                className={styles.nameInput}
                placeholder={`Player ${i + 1} name`}
                value={names[i] ?? ''}
                onChange={e => handleNameChange(i, e.target.value)}
              />
            ))}
          </div>
          <button className={styles.bigBtn} onClick={startGame} disabled={!names.slice(0, np).every(n => n.trim().length > 0)}>
            Start Game
          </button>
          <details className={styles.rulesBox}>
            <summary className={styles.rulesSummary}>How to Play</summary>
            <ul className={styles.rulesList}>
              <li>All 7 spies start together on the Treasure tile. Each player is secretly assigned one spy colour — tap <strong>Reveal my spy</strong> at any time to check yours.</li>
              <li>On your turn, roll the die. Click any spy token to move it one space clockwise; each click uses one move point. You can move any spy, not just your own.</li>
              <li>You must use all your move points. Once they&apos;re gone, click <strong>End Turn</strong>.</li>
              <li>If any spy is sitting <em>on</em> the Treasure tile when you click End Turn, all spies immediately score points equal to their current space value (0 to +10, or −3 for the penalty tile). The Treasure then jumps to a new random empty tile.</li>
              <li>First spy to reach <strong>{targetGoal} points</strong> triggers the endgame.</li>
              <li>Each player secretly guesses which colour the others control. Each correct guess earns <strong>+5 bonus points</strong>.</li>
              <li>Highest total score wins. Move carefully — and bluff!</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  const cur = g.players[g.cur];

  // ── Choose Treasure location ──────────────────────────────────────────────────

  if (g.phase === 'chooseTreasure') {
    const occupied = new Set(SPY_COLORS.map(c => g.pos[c]));
    return (
      <div className={styles.page}>
        <div className={styles.turnBar}>
          <span><strong>{cur.name}</strong>&apos;s Turn</span>
          <div className={styles.revealArea}>
            {!showSec ? (
              <button className={styles.revealBtn} onClick={() => setShowSec(true)}>
                Reveal my spy
              </button>
            ) : (
              <button
                className={styles.revealBadge}
                style={{ background: HEX[cur.secret] }}
                onClick={() => setShowSec(false)}
              >
                {cur.secret.toUpperCase()} &times;
              </button>
            )}
          </div>
        </div>

        <div className={styles.playRow}>
          <div className={styles.boardGrid}>
            {SPACE_VAL.map((val, i) => {
              const isOccupied = occupied.has(i);
              const [row, col] = GRID_POS[i];
              const isSafe = i === g.safePos;
              const spiesHere = SPY_COLORS.filter(c => g.pos[c] === i);
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    styles.tile,
                    isSafe ? styles.tileSafe : '',
                    isOccupied ? styles.tileChooseOccupied : styles.tileChooseSelectable,
                  ].join(' ')}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  onClick={() => { if (!isOccupied) chooseTreasureLocation(i); }}
                  disabled={isOccupied}
                >
                  <div className={styles.tileTop}>
                    {isSafe && (
                      <span className={styles.tileSafeLabel}>
                        <TreasureIcon className={styles.treasureIconInline} />
                        TREASURE
                      </span>
                    )}
                    <span className={`${styles.tileVal} ${val > 0 ? styles.tilePos : val < 0 ? styles.tileNeg : ''}`}>
                      {val > 0 ? `+${val}` : val}
                    </span>
                  </div>
                  <div className={styles.tileTokens}>
                    {spiesHere.map(c => (
                      <div key={c} className={styles.token} style={{ color: HEX[c] }}>
                        <SpyTokenIcon className={styles.tokenIcon} />
                      </div>
                    ))}
                  </div>
                  {isOccupied && <span className={styles.treasureTileX}>✕</span>}
                </button>
              );
            })}
            <div className={styles.boardCenter}>
              <TreasureIcon className={styles.gemLarge} />
              <h2 className={styles.chooseCenterHeading}>{cur.name}, where should the Treasure go?</h2>
              <p className={styles.chooseHint}>Choose any empty tile</p>
            </div>
          </div>

          <div className={styles.scoreSide}>
            <span className={styles.scoreLabel}>Score (/{g.targetGoal})</span>
            <div className={styles.scoreRows}>
              {SPY_COLORS.map(c => (
                <div key={c} className={styles.scoreRow}>
                  <div className={styles.scoreDot} style={{ background: HEX[c] }} />
                  <div className={styles.barWrap}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.max(0, Math.min(100, (g.score[c] / g.targetGoal) * 100))}%`,
                        background: HEX[c],
                      }}
                    />
                  </div>
                  <span className={styles.scoreNum}>{g.score[c]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guessing phase ────────────────────────────────────────────────────────────

  if (g.phase === 'guess') {
    const guesser = g.players[g.guesser];
    const playerCount = g.players.length;
    const dummyCount = SPY_COLORS.length - playerCount;
    const assignedPlayers = new Set<number>();
    const assignedDummies = new Set<number>();
    for (const occupant of Object.values(g.guessBoard)) {
      if (!occupant) continue;
      if (occupant.kind === 'player') assignedPlayers.add(occupant.playerId);
      else assignedDummies.add(occupant.dummyId);
    }
    const allSet = SPY_COLORS.every(color => g.guessBoard[color] !== undefined);
    return (
      <div className={styles.page}>
        <div className={styles.guessLayout}>
          <div className={styles.guessList}>
            {SPY_COLORS.map(color => {
              const occupant = g.guessBoard[color];
              return (
                <div
                  key={color}
                  className={`${styles.guessRow} ${dragGuessToken ? styles.guessRowDropActive : ''}`}
                  onDragOver={e => {
                    if (dragGuessToken) e.preventDefault();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragGuessToken) placeGuess(color, dragGuessToken);
                  }}
                >
                  <span className={styles.guessTarget}>
                    <SpyTokenIcon className={styles.guessColorIcon} style={{ color: HEX[color] }} />
                    {color.toUpperCase()}
                  </span>
                  <div className={styles.guessDropZone}>
                    {occupant ? (
                      <button
                        type="button"
                        className={`${styles.guessAssigned} ${occupant.kind === 'dummy' ? styles.guessAssignedDummy : ''}`}
                        draggable
                        onDragStart={() => setDragGuessToken(occupant)}
                        onDragEnd={() => setDragGuessToken(null)}
                        onDoubleClick={() => setG(prev => {
                          if (!prev) return prev;
                          const guessBoard = { ...prev.guessBoard };
                          delete guessBoard[color];
                          return { ...prev, guessBoard };
                        })}
                        title={`${color} is ${occupant.kind === 'player' ? g.players[occupant.playerId].name : 'Dummy'}`}
                      >
                        <SpyTokenIcon className={styles.guessAssignedIcon} />
                        <span>{occupant.kind === 'player' ? g.players[occupant.playerId].name : `Dummy ${occupant.dummyId + 1}`}</span>
                      </button>
                    ) : (
                      <div className={styles.guessEmpty}>Drop a color here</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.guessSidebar}>
            <h2 className={styles.guessHeading}>Final Guesses</h2>
            <div className={styles.guessProgress}>
              <div className={styles.guessProgressText}>
                <span>Player {g.guesser + 1} of {g.players.length}</span>
                <span>{g.players.length - g.guesser - 1} left</span>
              </div>
              <div className={styles.guessProgressBar} aria-hidden="true">
                <div
                  className={styles.guessProgressFill}
                  style={{ width: `${((g.guesser + 1) / g.players.length) * 100}%` }}
                />
              </div>
            </div>
            <p className={styles.guessSub}>
              Pass to <strong>{guesser.name}</strong>. Drag each player and dummy onto a color slot. Each player can only be used once.
            </p>
            <div className={styles.guessPalette}>
            {g.players.map(player => (
              <button
                key={player.id}
                className={`${styles.guessPaletteToken} ${styles.guessPalettePlayer} ${assignedPlayers.has(player.id) ? styles.guessPaletteTokenUsed : ''} ${dragGuessToken?.kind === 'player' && dragGuessToken.playerId === player.id ? styles.guessPaletteTokenDragging : ''}`}
                draggable
                onDragStart={() => setDragGuessToken({ kind: 'player', playerId: player.id })}
                onDragEnd={() => setDragGuessToken(null)}
                title={player.name}
              >
                <SpyTokenIcon className={styles.guessPaletteIcon} />
                <span>{player.name}</span>
              </button>
            ))}
            {Array.from({ length: dummyCount }).map((_, dummyId) => (
              <button
                key={`dummy-${dummyId}`}
                className={`${styles.guessPaletteToken} ${styles.guessPaletteDummy} ${assignedDummies.has(dummyId) ? styles.guessPaletteTokenUsed : ''} ${dragGuessToken?.kind === 'dummy' && dragGuessToken.dummyId === dummyId ? styles.guessPaletteTokenDragging : ''}`}
                draggable
                onDragStart={() => setDragGuessToken({ kind: 'dummy', dummyId })}
                onDragEnd={() => setDragGuessToken(null)}
                title={`Dummy ${dummyId + 1}`}
              >
                <SpyTokenIcon className={styles.guessPaletteIcon} />
                <span>Dummy {dummyId + 1}</span>
              </button>
            ))}
            </div>
            <button className={styles.bigBtn} disabled={!allSet} onClick={submitGuess}>
              {g.guesser < g.players.length - 1
                ? `Next → ${g.players[g.guesser + 1].name}`
                : 'Reveal Results'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game over screen ──────────────────────────────────────────────────────────

  if (g.phase === 'over') {
    const ownerByColor = new Map<SpyColor, number>();
    for (const player of g.players) {
      ownerByColor.set(player.secret, player.id);
    }
    const rows = g.players.map(p => {
      const guessBoard = p.guessBoard;
      const correctColors = Object.entries(guessBoard)
        .filter(([color, occupant]) => {
          if (!occupant) return false;
          const owner = ownerByColor.get(color as SpyColor);
          if (occupant.kind === 'player') return owner === occupant.playerId;
          return owner === undefined;
        })
        .map(([color]) => color as SpyColor);
      const bonus = correctColors.length * 5;
      return { p, correctColors, bonus, total: g.score[p.secret] + bonus };
    }).sort((a, b) => b.total - a.total);

    const winner = rows[0];
    const revealRows = SPY_COLORS.map(color => ({
      color,
      owner: g.players.find(player => player.secret === color) ?? null,
    }));
    return (
      <div className={styles.page}>
        <div className={styles.overTop}>
          <h2 className={styles.overHeading}>Game Over!</h2>
          <p className={styles.overWinner}>
            Winner: <span style={{ color: HEX[winner.p.secret] }}>{winner.p.name}</span>
          </p>
        </div>
        <div className={styles.overColumns}>
          <div className={styles.overMainColumn}>
            <div className={styles.finalTable}>
              <div className={styles.finalHeader}>
                <span>Player</span>
                <span>Score</span>
                <span>Bonus</span>
                <span>Total</span>
              </div>
              {rows.map(({ p, bonus, total }) => (
                <div key={p.id} className={styles.finalRow}>
                  <span>{p.name}</span>
                  <span>{g.score[p.secret]}</span>
                  <span>+{bonus}</span>
                  <span><strong>{total}</strong></span>
                </div>
              ))}
            </div>
            <button className={styles.revealDetailsBtn} onClick={() => setShowCorrectGuesses(v => !v)}>
              {showCorrectGuesses ? 'Hide correct guesses' : 'Reveal correct guesses'}
            </button>
            {showCorrectGuesses && (
              <div className={styles.correctGuessSection}>
                <h3 className={styles.revealHeading}>Correct Guesses</h3>
                <div className={styles.correctGuessGrid}>
                  {rows.map(({ p, correctColors }) => (
                    <div key={p.id} className={styles.correctGuessCard}>
                      <div className={styles.correctGuessHeader}>
                        <span>{p.name}</span>
                        <span>{correctColors.length}/7 correct</span>
                      </div>
                      <div className={styles.correctGuessList}>
                        {correctColors.length > 0 ? correctColors.map(color => (
                          <span key={color} className={styles.correctGuessChip} style={{ color: HEX[color] }}>
                            <SpyTokenIcon className={styles.guessAssignedIcon} />
                            {color}
                          </span>
                        )) : (
                          <span className={styles.finalGuessDummy}>No correct guesses</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className={styles.overSideColumn}>
            <div className={styles.revealSection}>
              <h3 className={styles.revealHeading}>Identities Revealed</h3>
              <div className={styles.revealGrid}>
                {revealRows.map(({ color, owner }) => (
                  <div key={color} className={styles.revealCard} style={{ borderColor: HEX[color] }}>
                    <span className={styles.revealBadge} style={{ background: HEX[color] }}>
                      {color.toUpperCase()}
                    </span>
                    <span className={styles.revealName}>
                      {owner ? owner.name : 'Dummy'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button className={styles.bigBtn} onClick={() => { setG(null); setShowSec(false); setShowCorrectGuesses(false); }}>
          New Game
        </button>
      </div>
    );
  }

  // ── Playing phase (also handles 'scoring' animation) ─────────────────────────

  const isAnimating = g.phase === 'scoring';
  const canRoll = !isAnimating && g.die === null;
  const canPick = !isAnimating && g.die !== null && g.left > 0;
  const displayedScores = animScores ?? g.score;

  // Tiles reachable by the spy currently being dragged
  const reachable: Set<number> | null = (dragSpy && canPick)
    ? (() => {
        const s = new Set<number>();
        const from = g.pos[dragSpy];
        for (let n = 1; n <= g.left; n++) s.add((from + n) % NUM_SPACES);
        return s;
      })()
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.turnBar}>
        <span><strong>{cur.name}</strong>&apos;s Turn</span>
        <div className={styles.turnProgress}>
          <div className={styles.turnProgressText}>
            <span>Turn {g.cur + 1} of {g.players.length}</span>
            <span>{g.players.length - g.cur - 1} after this</span>
          </div>
          <div className={styles.turnProgressBar} aria-hidden="true">
            <div
              className={styles.turnProgressFill}
              style={{ width: `${((g.cur + 1) / g.players.length) * 100}%` }}
            />
          </div>
        </div>
        <div className={styles.revealArea}>
          {!showSec ? (
            <button className={styles.revealBtn} onClick={() => setShowSec(true)}>
              Reveal my spy
            </button>
          ) : (
            <button
              className={styles.revealBadge}
              style={{ background: HEX[cur.secret] }}
              onClick={() => setShowSec(false)}
            >
              {cur.secret.toUpperCase()} &times;
            </button>
          )}
        </div>
      </div>

      <div className={styles.playRow}>
      <div className={styles.boardGrid}>
        {SPACE_VAL.map((val, i) => {
          const [row, col] = GRID_POS[i];
          const isSafe = i === g.safePos;
          const spiesHere = SPY_COLORS.filter(c => g.pos[c] === i);
          return (
            <div
              key={i}
              className={[
                styles.tile,
                isSafe ? styles.tileSafe : '',
                reachable?.has(i) ? styles.tileReachable : '',
                draggingOver === i ? styles.tileDragOver : '',
              ].join(' ')}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              onDragOver={e => {
                if (reachable?.has(i)) { e.preventDefault(); setDraggingOver(i); }
              }}
              onDragLeave={() => setDraggingOver(d => d === i ? null : d)}
              onDrop={e => { e.preventDefault(); handleTileDrop(i); }}
            >
              <div className={styles.tileTop}>
                {isSafe && (
                  <span className={styles.tileSafeLabel}>
                    <TreasureIcon className={styles.treasureIconInline} />
                    TREASURE
                  </span>
                )}
                <span className={`${styles.tileVal} ${val > 0 ? styles.tilePos : val < 0 ? styles.tileNeg : ''}`}>
                  {val > 0 ? `+${val}` : val}
                </span>
              </div>
              <div className={styles.tileTokens}>
                {spiesHere.map(c => (
                  <div
                    key={c}
                    className={`${styles.token} ${canPick ? styles.tokenClickable : ''}`}
                    style={{ color: HEX[c] }}
                    draggable={canPick}
                    onDragStart={e => {
                      setDragSpy(c);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragSpy(null);
                      setDraggingOver(null);
                    }}
                    onClick={() => { if (canPick) pickSpy(c); }}
                    title={c}
                  >
                    <SpyTokenIcon className={styles.tokenIcon} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className={styles.boardCenter}>
          {isAnimating && (
            <div className={styles.animBanner}>
              <span className={styles.animGem}>💎</span>
              <span className={styles.animTitle}>TREASURE!</span>
            </div>
          )}
          {!isAnimating && canRoll && (
            <button className={styles.rollBtn} onClick={roll}>Roll</button>
          )}
          {!isAnimating && g.die !== null && (
            <div className={styles.dieDisplay}>
              <span className={styles.dieNumber}>{g.die}</span>
              {canPick
                ? <span className={styles.dieLeft}>{g.left} left</span>
                : <span className={styles.dieReady}>all moved!</span>
              }
            </div>
          )}
          {canPick && <p className={styles.centerHint}>tap spies</p>}
          {!canPick && !isAnimating && g.die !== null && (
            <button className={`${styles.rollBtn} ${styles.endTurnBtn}`} onClick={endTurn}>End Turn</button>
          )}
        </div>
      </div>

      <div className={styles.scoreSide}>
        <span className={styles.scoreLabel}>Score (/{g.targetGoal})</span>
        <div className={styles.scoreRows}>
          {SPY_COLORS.map(c => {
            const delta = isAnimating ? (g.deltas?.find(d => d.c === c)?.d ?? 0) : null;
            return (
              <div key={c} className={styles.scoreRow}>
                <div className={styles.scoreDot} style={{ background: HEX[c] }} />
                <div className={styles.barWrap}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.max(0, Math.min(100, (displayedScores[c] / g.targetGoal) * 100))}%`,
                      background: HEX[c],
                    }}
                  />
                </div>
                <span className={styles.scoreNum}>{displayedScores[c]}</span>
                {delta !== null && delta !== 0 && (
                  <span className={`${styles.scoreDelta} ${delta > 0 ? styles.pos : styles.neg}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {g.deltas !== null && !isAnimating && (
        <button className={styles.showLastBtn} onClick={() => setShowLastDeltas(true)}>
          Show last Treasure trigger
        </button>
      )}

      {showLastDeltas && g.deltas && (
        <div className={styles.deltaModal} onClick={() => setShowLastDeltas(false)}>
          <div className={styles.deltaModalInner} onClick={e => e.stopPropagation()}>
            <h3 className={styles.scoringHeading}>Last Treasure Trigger</h3>
            <p className={styles.safeMoved}>
              Treasure is now on space {g.safePos}
              {' '}(value: <strong>{SPACE_VAL[g.safePos] > 0 ? `+${SPACE_VAL[g.safePos]}` : SPACE_VAL[g.safePos]}</strong>)
            </p>
            <div className={styles.deltaList}>
              {g.deltas.map(({ c, d, to }) => (
                <div key={c} className={styles.deltaRow}>
                  <span className={styles.dot} style={{ background: HEX[c] }} />
                  <span className={styles.deltaName}>{c}</span>
                  <span className={`${styles.deltaChange} ${d > 0 ? styles.pos : d < 0 ? styles.neg : styles.zero}`}>
                    {d > 0 ? `+${d}` : `${d}`}
                  </span>
                  <span className={styles.deltaTo}>
                    &rarr; <strong>{to}</strong>
                    {to >= g.targetGoal && <span className={styles.trigger}> TRIGGERED!</span>}
                  </span>
                </div>
              ))}
            </div>
            <button className={styles.bigBtn} onClick={() => setShowLastDeltas(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
