import React from 'react';
import styles from './Leaderboard.module.css';
import ConfirmModal from './ConfirmModal';
import ReusableTable, { type TableColumn } from '../components/ReusableTable/ReusableTable';

export type WinRecord = {
  rows: number;
  cols: number;
  mines: number;
  time: number;
  date: string;
};

type LeaderboardRow = {
  rank: number;
  date: string;
  size: string;
  mines: number;
  time: number;
};

type CategoryKey = 'Small' | 'Medium' | 'Large' | 'Custom';

const CATEGORY_ORDER: CategoryKey[] = ['Small', 'Medium', 'Large', 'Custom'];

const CATEGORY_LABELS: Record<CategoryKey, { title: string; description: string }> = {
  Small: { title: 'Small', description: '8x8 board, 10 mines' },
  Medium: { title: 'Medium', description: '16x16 board, 40 mines' },
  Large: { title: 'Large', description: '16x30 board, 99 mines' },
  Custom: { title: 'Custom', description: 'Any custom setup' },
};

function getLeaderboard(): WinRecord[] {
  const prev = sessionStorage.getItem('minesweeperWins');
  let wins: WinRecord[] = [];
  if (prev) {
    try {
      wins = JSON.parse(prev);
    } catch { /* ignore parse error */ }
  }
  wins.sort((a: WinRecord, b: WinRecord) => a.time - b.time);
  return wins;
}

function categorizeWin(win: WinRecord): 'Small' | 'Medium' | 'Large' | 'Custom' {
  if (win.rows === 8 && win.cols === 8 && win.mines === 10) return 'Small';
  if (win.rows === 16 && win.cols === 16 && win.mines === 40) return 'Medium';
  if (win.rows === 16 && win.cols === 30 && win.mines === 99) return 'Large';
  return 'Custom';
}

const leaderboardColumns: Array<TableColumn<LeaderboardRow>> = [
  {
    key: 'rank',
    header: '#',
    align: 'center',
    width: '64px',
    render: value => {
      const rank = Number(value);
      const topClass = rank <= 3 ? styles.topRank : '';
      return <span className={`${styles.rankBadge} ${topClass}`}>{rank}</span>;
    },
  },
  {
    key: 'date',
    header: 'Date',
    render: value => {
      const d = new Date(String(value));
      const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return (
        <span className={styles.leaderDateCell}>
          <span className={styles.leaderDate}>{dateStr}</span>
          <span className={styles.leaderTime}>{timeStr}</span>
        </span>
      );
    },
  },
  { key: 'size', header: 'Size', align: 'center' },
  { key: 'mines', header: 'Mines', align: 'center' },
  {
    key: 'time',
    header: 'Time (s)',
    align: 'center',
    render: value => <span className={styles.timeCell}>{value}</span>,
  },
];

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = React.useState<WinRecord[]>(getLeaderboard());
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryKey>('Small');
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    // Listen for storage changes in case another tab updates
    const handler = () => setLeaderboard(getLeaderboard());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Categorize wins
  const categorized = {
    Small: [] as WinRecord[],
    Medium: [] as WinRecord[],
    Large: [] as WinRecord[],
    Custom: [] as WinRecord[],
  };
  leaderboard.forEach(win => {
    categorized[categorizeWin(win)].push(win);
  });

  const totalWins = leaderboard.length;
  const fastestTime = leaderboard.length > 0 ? leaderboard[0].time : null;
  const averageTime =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((sum, win) => sum + win.time, 0) / leaderboard.length)
      : null;
  const selectedWins = categorized[selectedCategory];
  const selectedMeta = CATEGORY_LABELS[selectedCategory];

  function renderTable(wins: WinRecord[]) {
    const rows: LeaderboardRow[] = wins.map((win, i) => ({
      rank: i + 1,
      date: win.date,
      size: `${win.rows}x${win.cols}`,
      mines: win.mines,
      time: win.time,
    }));

    return (
      <ReusableTable
        columns={leaderboardColumns}
        rows={rows}
        emptyMessage="No wins yet."
      />
    );
  }

  function clearLeaderboard() {
    sessionStorage.removeItem('minesweeperWins');
    setLeaderboard([]);
    setShowConfirm(false);
  }

  return (
    <div className={styles.leaderContainer}>
      <header className={styles.leaderHeader}>
        <div>
          <h3 className={styles.leaderTitle}>Leaderboard</h3>
          <p className={styles.leaderSubtitle}>Track your best Minesweeper runs by board type.</p>
        </div>
        <button
          className={styles.clearButton}
          type="button"
          onClick={() => setShowConfirm(true)}
        >
          Clear Leaderboard
        </button>
      </header>

      <div className={styles.metricsRow}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Total wins</span>
          <strong className={styles.metricValue}>{totalWins}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Best time</span>
          <strong className={styles.metricValue}>{fastestTime === null ? '--' : `${fastestTime}s`}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Average time</span>
          <strong className={styles.metricValue}>{averageTime === null ? '--' : `${averageTime}s`}</strong>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <aside className={styles.categoryRail}>
          {CATEGORY_ORDER.map(category => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.categoryButtonActive : ''}`}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
            >
              <span className={styles.categoryTitle}>{CATEGORY_LABELS[category].title}</span>
              <span className={styles.categoryDescription}>{CATEGORY_LABELS[category].description}</span>
              <span className={styles.categoryCount}>{categorized[category].length} entries</span>
            </button>
          ))}
        </aside>

        <section className={styles.tablePanel}>
          <div key={selectedCategory} className={styles.categorySwap}>
            <div className={styles.tableHeader}>
              <h4>{selectedMeta.title}</h4>
              <p>{selectedMeta.description}</p>
            </div>
            <div className={styles.tableWrap}>{renderTable(selectedWins)}</div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={showConfirm}
        message="Are you sure you want to clear the leaderboard? This cannot be undone."
        onConfirm={clearLeaderboard}
        onCancel={() => setShowConfirm(false)}
        confirmText="Yes, clear"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Leaderboard;
