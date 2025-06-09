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

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = React.useState<WinRecord[]>(getLeaderboard());

  React.useEffect(() => {
    setLeaderboard(getLeaderboard());
    // Listen for storage changes in case another tab updates
    const handler = () => setLeaderboard(getLeaderboard());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className={styles.leaderContainer}>
      <h3 style={{ marginBottom: 8 }}>Leaderboard</h3>
      {leaderboard.length === 0 ? (
        <div>No wins yet this session.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
            {leaderboard.map((win, i) => (
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
      )}
    </div>
  );
};

export default Leaderboard;
