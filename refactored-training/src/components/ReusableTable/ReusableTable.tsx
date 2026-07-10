import styles from './ReusableTable.module.css'

export type TableColumn<T> = {
  key: keyof T
  header: string
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

type ReusableTableProps<T extends Record<string, unknown>> = {
  columns: Array<TableColumn<T>>
  rows: T[]
  caption?: string
  emptyMessage?: string
}

function ReusableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  emptyMessage = 'No data available.',
}: ReusableTableProps<T>) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={String(column.key)}
                scope="col"
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => {
                  const value = row[column.key]
                  const displayValue = column.render ? column.render(value, row) : String(value ?? '')

                  return (
                    <td key={`${String(column.key)}-${rowIndex}`} style={{ textAlign: column.align ?? 'left' }}>
                      {displayValue}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ReusableTable
