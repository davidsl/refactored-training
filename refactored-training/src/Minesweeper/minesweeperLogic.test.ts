import { describe, expect, it } from 'vitest'
import {
  calculateScore,
  generateBoard,
  getCustomBoardValidationError,
  getGameOutcome,
} from './minesweeperLogic'
import type { Cell } from './minesweeperLogic'

function createCell(overrides: Partial<Cell> = {}): Cell {
  return { mine: false, revealed: false, adjacent: 0, flagged: false, ...overrides }
}

function createSequenceRandom(samples: number[]): () => number {
  let sampleIndex = 0
  return () => {
    const sample = samples[sampleIndex]
    if (sample === undefined) throw new Error('Random sample sequence exhausted.')
    sampleIndex++
    return sample
  }
}

describe('generateBoard', () => {
  it('places the requested mines, calculates neighbor counts, and selects a zero-adjacent safe tile', () => {
    const { board, preReveal } = generateBoard(5, 5, 3, createSequenceRandom([0, 0, 0, 0.8, 0.8, 0, 0]))

    expect(board).toHaveLength(5)
    expect(board.every(row => row.length === 5)).toBe(true)
    expect(board.flat().filter(cell => cell.mine)).toHaveLength(3)

    for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
      for (let columnIndex = 0; columnIndex < board[rowIndex].length; columnIndex++) {
        const cell = board[rowIndex][columnIndex]
        if (cell.mine) continue

        let expectedAdjacentMines = 0
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
            if (rowOffset === 0 && columnOffset === 0) continue
            const neighborRow = rowIndex + rowOffset
            const neighborColumn = columnIndex + columnOffset
            if (
              neighborRow >= 0 && neighborRow < board.length &&
              neighborColumn >= 0 && neighborColumn < board[rowIndex].length &&
              board[neighborRow][neighborColumn].mine
            ) {
              expectedAdjacentMines++
            }
          }
        }
        expect(cell.adjacent).toBe(expectedAdjacentMines)
      }
    }

    expect(preReveal).not.toBeNull()
    expect(board[preReveal!.r][preReveal!.c].mine).toBe(false)
    expect(board[preReveal!.r][preReveal!.c].adjacent).toBe(0)
  })

  it('falls back to a safe tile when no zero-adjacent tile exists', () => {
    const { board, preReveal } = generateBoard(2, 2, 3, createSequenceRandom([0, 0, 0, 0.5, 0.5, 0, 0]))

    expect(board.flat().filter(cell => cell.mine)).toHaveLength(3)
    expect(preReveal).toEqual({ r: 1, c: 1 })
    expect(board[preReveal!.r][preReveal!.c].adjacent).toBe(3)
  })

  it('rejects invalid dimensions and impossible mine counts', () => {
    expect(() => generateBoard(0, 5, 1)).toThrow(RangeError)
    expect(() => generateBoard(5, 5, 25)).toThrow(RangeError)
    expect(() => generateBoard(5, 5, 1.5)).toThrow(RangeError)
  })
})

describe('getGameOutcome', () => {
  it('stays in progress while a safe cell is unrevealed, even if it is flagged', () => {
    const board = [[
      createCell({ revealed: true }),
      createCell({ mine: true }),
      createCell({ flagged: true }),
    ]]

    expect(getGameOutcome(board)).toBe('playing')
  })

  it('wins when every safe cell is revealed without requiring bombs to be flagged', () => {
    const board = [[
      createCell({ revealed: true }),
      createCell({ mine: true }),
      createCell({ revealed: true }),
    ]]

    expect(getGameOutcome(board)).toBe('won')
  })

  it('loses when a mine is detonated', () => {
    const board = [[createCell({ revealed: true }), createCell({ mine: true })]]

    expect(getGameOutcome(board, true)).toBe('lost')
  })
})

describe('calculateScore', () => {
  it('returns no score for a loss and awards the expected winning score', () => {
    expect(calculateScore(8, 8, 10, 0, false)).toBe(0)
    expect(calculateScore(8, 8, 10, 0, true)).toBe(1527)
  })

  it('subtracts elapsed-time penalties and never returns a negative score', () => {
    expect(calculateScore(8, 8, 10, 10, true)).toBe(1497)
    expect(calculateScore(8, 8, 10, 1000, true)).toBe(0)
  })
})

describe('getCustomBoardValidationError', () => {
  it('accepts the minimum and maximum supported custom boards', () => {
    expect(getCustomBoardValidationError(5, 5, 1)).toBeNull()
    expect(getCustomBoardValidationError(50, 30, 1499)).toBeNull()
  })

  it('rejects dimensions outside supported integer bounds', () => {
    expect(getCustomBoardValidationError(4, 5, 1)).toBe('dimensions')
    expect(getCustomBoardValidationError(5, 4, 1)).toBe('dimensions')
    expect(getCustomBoardValidationError(51, 5, 1)).toBe('dimensions')
    expect(getCustomBoardValidationError(5, 31, 1)).toBe('dimensions')
    expect(getCustomBoardValidationError(5.5, 5, 1)).toBe('dimensions')
  })

  it('requires an integer mine count that leaves at least one safe tile', () => {
    expect(getCustomBoardValidationError(5, 5, 0)).toBe('mines')
    expect(getCustomBoardValidationError(5, 5, 25)).toBe('mines')
    expect(getCustomBoardValidationError(5, 5, 1.5)).toBe('mines')
  })
})