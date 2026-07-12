import { useEffect, useState } from 'react';
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
const WIN = 42;

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

type Phase = 'setup' | 'play' | 'scoring' | 'guess' | 'over';

interface Player {
  id: number;
  name: string;
  secret: SpyColor;
  guesses: Record<number, SpyColor>;
}

interface Delta {
  c: SpyColor;
  d: number;
  to: number;
}

interface G {
  phase: Phase;
  players: Player[];
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpyGame() {
  const [np, setNp] = useState(2);
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [g, setG] = useState<G | null>(null);
  const [showSec, setShowSec] = useState(false);
  const [dragSpy, setDragSpy] = useState<SpyColor | null>(null);
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
      guesses: {},
    }));
    setG({
      phase: 'play', players,
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
        const occupied = new Set(Object.values(prev.pos));
        occupied.add(prev.safePos);
        let newSafePos: number;
        do {
          newSafePos = Math.floor(Math.random() * NUM_SPACES);
        } while (occupied.has(newSafePos));
        return {
          ...prev, score, safePos: newSafePos,
          phase: 'scoring' as Phase, deltas,
          animFrom: prev.score,
          die: null, left: 0,
          endFlag: Object.values(score).some(s => s >= WIN),
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

  function setGuess(playerId: number, c: SpyColor) {
    setG(prev => {
      if (!prev) return prev;
      const players = prev.players.map((p, i) =>
        i === prev.guesser ? { ...p, guesses: { ...p.guesses, [playerId]: c } } : p
      );
      return { ...prev, players };
    });
  }

  function submitGuess() {
    setG(prev => {
      if (!prev) return prev;
      if (prev.guesser < prev.players.length - 1) return { ...prev, guesser: prev.guesser + 1 };
      // All guessed — add bonus points then go to gameover
      const score = { ...prev.score };
      for (const p of prev.players) {
        for (const other of prev.players) {
          if (other.id !== p.id && p.guesses[other.id] === other.secret) {
            score[p.secret] += 5;
          }
        }
      }
      return { ...prev, phase: 'over' as Phase, score };
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
              <li>First spy to reach <strong>{WIN} points</strong> triggers the endgame.</li>
              <li>Each player secretly guesses which colour the others control. Each correct guess earns <strong>+5 bonus points</strong>.</li>
              <li>Highest total score wins. Move carefully — and bluff!</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  const cur = g.players[g.cur];

  // ── Guessing phase ────────────────────────────────────────────────────────────

  if (g.phase === 'guess') {
    const guesser = g.players[g.guesser];
    const others = g.players.filter(p => p.id !== guesser.id);
    const allSet = others.every(p => guesser.guesses[p.id] !== undefined);
    return (
      <div className={styles.page}>
        <h2 className={styles.guessHeading}>Final Guesses</h2>
        <p className={styles.guessSub}>
          Pass to <strong>{guesser.name}</strong> — which spy does each player control?
        </p>
        <div className={styles.guessList}>
          {others.map(target => (
            <div key={target.id} className={styles.guessRow}>
              <span className={styles.guessTarget}>{target.name} is&hellip;</span>
              <div className={styles.colourRow}>
                {SPY_COLORS.map(c => (
                  <button
                    key={c}
                    className={`${styles.colourBtn} ${guesser.guesses[target.id] === c ? styles.colourBtnSel : ''}`}
                    style={{ background: HEX[c] }}
                    onClick={() => setGuess(target.id, c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className={styles.bigBtn} disabled={!allSet} onClick={submitGuess}>
          {g.guesser < g.players.length - 1
            ? `Next \u2192 ${g.players[g.guesser + 1].name}`
            : 'Reveal Results'}
        </button>
      </div>
    );
  }

  // ── Game over screen ──────────────────────────────────────────────────────────

  if (g.phase === 'over') {
    const rows = g.players.map(p => {
      const bonus = g.players
        .filter(o => o.id !== p.id && p.guesses[o.id] === o.secret)
        .length * 5;
      return { p, track: g.score[p.secret] - bonus, bonus, total: g.score[p.secret] };
    }).sort((a, b) => b.total - a.total);

    const winner = rows[0];
    return (
      <div className={styles.page}>
        <div className={styles.overTop}>
          <div className={styles.trophy}>🏆</div>
          <h2 className={styles.overHeading}>Game Over!</h2>
          <p className={styles.overWinner}>
            Winner: <span style={{ color: HEX[winner.p.secret] }}>{winner.p.name}</span>
          </p>
        </div>
        <div className={styles.finalTable}>
          <div className={styles.finalHeader}>
            <span>Player</span>
            <span>Spy</span>
            <span>Track</span>
            <span>Guesses</span>
            <span>Total</span>
          </div>
          {rows.map(({ p, track, bonus, total }) => (
            <div key={p.id} className={styles.finalRow}>
              <span>{p.name}</span>
              <span>
                <span className={styles.dot} style={{ background: HEX[p.secret] }} />
                {p.secret}
              </span>
              <span>{track}</span>
              <span>+{bonus}</span>
              <span><strong>{total}</strong></span>
            </div>
          ))}
        </div>
        <div className={styles.revealSection}>
          <h3 className={styles.revealHeading}>Identities Revealed</h3>
          <div className={styles.revealGrid}>
            {g.players.map(p => (
              <div key={p.id} className={styles.revealCard} style={{ borderColor: HEX[p.secret] }}>
                <span className={styles.revealName}>{p.name}</span>
                <span className={styles.revealBadge} style={{ background: HEX[p.secret] }}>
                  {p.secret.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button className={styles.bigBtn} onClick={() => { setG(null); setShowSec(false); }}>
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
                {isSafe && <span className={styles.tileSafeLabel}>TREASURE</span>}
                <span className={`${styles.tileVal} ${val > 0 ? styles.tilePos : val < 0 ? styles.tileNeg : ''}`}>
                  {val > 0 ? `+${val}` : val}
                </span>
              </div>
              <div className={styles.tileTokens}>
                {spiesHere.map(c => (
                  <div
                    key={c}
                    className={`${styles.token} ${canPick ? styles.tokenClickable : ''}`}
                    style={{ background: HEX[c] }}
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
                  />
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
            <button className={styles.rollBtn} onClick={roll}>Roll Die</button>
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
            <button className={styles.rollBtn} onClick={endTurn}>End Turn</button>
          )}
        </div>
      </div>

      <div className={styles.scoreSide}>
        <span className={styles.scoreLabel}>Score (/{WIN})</span>
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
                      width: `${Math.max(0, Math.min(100, (displayedScores[c] / WIN) * 100))}%`,
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

      <div className={styles.revealBottom}>
        {!showSec
          ? (
            <button className={styles.revealBtnSmall} onClick={() => setShowSec(true)}>
              Reveal my spy
            </button>
          )
          : (
            <button
              className={styles.revealBadgeSmall}
              style={{ background: HEX[cur.secret] }}
              onClick={() => setShowSec(false)}
            >
              {cur.secret.toUpperCase()} &times;
            </button>
          )
        }
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
                    {to >= WIN && <span className={styles.trigger}> TRIGGERED!</span>}
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
