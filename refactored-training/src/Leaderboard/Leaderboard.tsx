import React from 'react';
import styles from './Leaderboard.module.css';

export type WinRecord = {
  rows: number;
  cols: number;
  mines: number;
  time: number;
  date: string;
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

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = React.useState<WinRecord[]>(getLeaderboard());
  const [showCustom, setShowCustom] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    setLeaderboard(getLeaderboard());
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

  function renderTable(wins: WinRecord[]) {
    return wins.length === 0 ? (
      <div className={styles.noWins}>No wins yet.</div>
    ) : (
      <table className={styles.leaderTable}>
        <thead>
          <tr className={styles.leaderTableHeadRow}>
            <th className={styles.leaderTableHeadCell}>#</th>
            <th className={styles.leaderTableHeadCell}>Date</th>
            <th className={styles.leaderTableHeadCell}>Size</th>
            <th className={styles.leaderTableHeadCell}>Mines</th>
            <th className={styles.leaderTableHeadCell}>Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {wins.map((win, i) => {
            const d = new Date(win.date);
            const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <tr key={i} className={i % 2 === 0 ? styles.leaderTableRow : styles.leaderTableRowAlt}>
                <td className={styles.leaderTableCell + ' ' + styles.leaderTableCellNum}>{i + 1}</td>
                <td className={styles.leaderTableCell + ' ' + styles.leaderTableCellDate}>
                  <span className={styles.leaderDate}>{dateStr}</span>
                  <span className={styles.leaderTime}>{timeStr}</span>
                </td>
                <td className={styles.leaderTableCell}>{win.rows}x{win.cols}</td>
                <td className={styles.leaderTableCell}>{win.mines}</td>
                <td className={styles.leaderTableCell}>{win.time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function clearLeaderboard() {
    sessionStorage.removeItem('minesweeperWins');
    setLeaderboard([]);
    setShowConfirm(false);
  }

  return (
    <div className={styles.leaderContainer}>
      <h3 className={styles.leaderTitle}>Leaderboard</h3>
      <button
        className={styles.clearButton}
        type="button"
        onClick={() => setShowConfirm(true)}
        style={{ marginBottom: 16 }}
      >
        Clear Leaderboard
      </button>
      {showConfirm && (
        <div className={styles.confirmModalOverlay}>
          <div className={styles.confirmModalBox}>
            <div className={styles.confirmModalText}>Are you sure you want to clear the leaderboard? This cannot be undone.</div>
            <div className={styles.confirmModalActions}>
              <button className={styles.confirmButton} onClick={clearLeaderboard}>Yes, clear</button>
              <button className={styles.cancelButton} onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.leaderFlexRow}>
        <div className={styles.leaderCategoryCol}>
          <h4 className={styles.leaderCategoryTitle}>Small (8x8, 10 mines)</h4>
          {renderTable(categorized.Small)}
        </div>
        <div className={styles.leaderCategoryCol}>
          <h4 className={styles.leaderCategoryTitle}>Medium (16x16, 40 mines)</h4>
          {renderTable(categorized.Medium)}
        </div>
        <div className={styles.leaderCategoryCol}>
          <h4 className={styles.leaderCategoryTitle}>Large (16x30, 99 mines)</h4>
          {renderTable(categorized.Large)}
        </div>
        <div className={styles.leaderCategoryCol}>
          <h4 className={styles.leaderCategoryTitle}>
            <button
              className={styles.showCustomButton}
              type="button"
              onClick={() => setShowCustom(v => !v)}
            >
              {showCustom ? 'Hide' : 'Show'} Custom
            </button>
          </h4>
          {showCustom && renderTable(categorized.Custom)}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
