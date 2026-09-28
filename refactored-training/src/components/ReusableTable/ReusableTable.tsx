import { useState } from 'react'
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

type SortDirection = 'ascending' | 'descending'

function ReusableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  emptyMessage = 'No data available.',
}: ReusableTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending')

  const sortedRows = sortKey
    ? rows
        .map((row, index) => ({ row, index }))
        .sort((first, second) => {
          const firstValue = first.row[sortKey]
          const secondValue = second.row[sortKey]
          const comparison = String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, {
            numeric: true,
            sensitivity: 'base',
          })

          if (comparison === 0) {
            return first.index - second.index
          }

          return sortDirection === 'ascending' ? comparison : -comparison
        })
        .map(({ row }) => row)
    : rows

  function toggleSort(columnKey: keyof T) {
    if (sortKey === columnKey) {
      setSortDirection(currentDirection => (currentDirection === 'ascending' ? 'descending' : 'ascending'))
      return
    }

    setSortKey(columnKey)
    setSortDirection('ascending')
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map(column => {
              const isSorted = sortKey === column.key
              const directionLabel = isSorted && sortDirection === 'ascending' ? 'descending' : 'ascending'

              return (
                <th
                  key={String(column.key)}
                  scope="col"
                  aria-sort={isSorted ? sortDirection : 'none'}
                  style={{ width: column.width, textAlign: column.align ?? 'left' }}
                >
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => toggleSort(column.key)}
                    aria-label={`Sort by ${column.header} ${directionLabel}`}
                    style={{
                      justifyContent:
                        column.align === 'center'
                          ? 'center'
                          : column.align === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                    }}
                  >
                    <span>{column.header}</span>
                    <span className={styles.sortIndicator} aria-hidden="true">
                      {isSorted ? (sortDirection === 'ascending' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              )
            })}
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
            sortedRows.map((row, rowIndex) => (
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
