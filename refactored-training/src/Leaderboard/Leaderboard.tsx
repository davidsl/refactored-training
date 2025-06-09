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
      <div style={{ marginBottom: 12 }}>No wins yet.</div>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 4, border: '1px solid #bbb' }}>#</th>
            <th style={{ padding: 4, border: '1px solid #bbb' }}>Date</th>
            <th style={{ padding: 4, border: '1px solid #bbb' }}>Size</th>
            <th style={{ padding: 4, border: '1px solid #bbb' }}>Mines</th>
            <th style={{ padding: 4, border: '1px solid #bbb' }}>Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {wins.map((win, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: 4, border: '1px solid #ddd', textAlign: 'center' }}>{i + 1}</td>
              <td style={{ padding: 4, border: '1px solid #ddd' }}>{new Date(win.date).toLocaleString()}</td>
              <td style={{ padding: 4, border: '1px solid #ddd' }}>{win.rows}x{win.cols}</td>
              <td style={{ padding: 4, border: '1px solid #ddd' }}>{win.mines}</td>
              <td style={{ padding: 4, border: '1px solid #ddd' }}>{win.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={styles.leaderContainer}>
      <h3 style={{ marginBottom: 8 }}>Leaderboard</h3>
      <h4>Small (8x8, 10 mines)</h4>
      {renderTable(categorized.Small)}
      <h4>Medium (16x16, 40 mines)</h4>
      {renderTable(categorized.Medium)}
      <h4>Large (16x30, 99 mines)</h4>
      {renderTable(categorized.Large)}
      <h4>Custom</h4>
      {renderTable(categorized.Custom)}
    </div>
  );
};

export default Leaderboard;
