import type { Piece } from './Types'

export type SortDirection = 'asc' | 'desc'

export interface TableSort {
  id: keyof Piece
  desc: boolean
}

export interface TableState {
  pieces: Piece[]
  pageIndex: number
  pageSize: number
  globalFilter: string
  sorting: TableSort[]
  loading: boolean
  error: string | null
}

export interface TableFilters extends Partial<TableState> {
  pageIndex?: number
  pageSize?: number
  globalFilter?: string
  sorting?: TableSort[]
}

export interface TableRow<T> {
  original: T
  index: number
}

export interface TableColumn<T> {
  id: keyof T
  key: keyof T
  label: string
  sortable?: boolean
  accessor?: (row: T) => any
  render?: (row: T) => any
}

export type GenreType = 
  | 'traditionell'
  | 'klassik'
  | 'barock'
  | 'moderne-klassik'
  | 'romantik'
  | 'musicals'
  | 'pop-rock-modern'
  | 'weihnachtsmusik'
  | 'filmmusik'

export type DifficultyLevel = 
  | 'easy'
  | 'medium'
  | 'hard'
  | 'very-hard'
  | 'unknown'