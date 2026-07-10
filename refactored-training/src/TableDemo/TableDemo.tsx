import ReusableTable, { type TableColumn } from '../components/ReusableTable/ReusableTable'
import styles from './TableDemo.module.css'

type PlayerRow = {
  player: string
  rank: number
  points: number
  status: 'Active' | 'Idle'
}

const rows: PlayerRow[] = [
  { player: 'Ari', rank: 1, points: 1280, status: 'Active' },
  { player: 'Nova', rank: 2, points: 1175, status: 'Active' },
  { player: 'Kai', rank: 3, points: 1090, status: 'Idle' },
  { player: 'Mila', rank: 4, points: 980, status: 'Active' },
  { player: 'Zed', rank: 5, points: 910, status: 'Idle' },
]

const columns: Array<TableColumn<PlayerRow>> = [
  { key: 'rank', header: 'Rank', align: 'center', width: '90px' },
  { key: 'player', header: 'Player' },
  {
    key: 'points',
    header: 'Points',
    align: 'right',
    render: value => `${value} pts`,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: value => (
      <span className={value === 'Active' ? styles.statusActive : styles.statusIdle}>{String(value)}</span>
    ),
  },
]

function TableDemo() {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h2>Reusable Table Component</h2>
        <p>
          This tab demonstrates a reusable and typed table that can render different datasets by swapping columns and rows.
        </p>
      </header>
      <ReusableTable
        columns={columns}
        rows={rows}
        caption="Top players this week"
        emptyMessage="No players found yet."
      />
    </section>
  )
}

export default TableDemo
