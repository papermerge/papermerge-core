export interface PaginatedResponse<T> {
  page_size: number
  page_number: number
  num_pages: number
  total_items?: number
  items: T[]
}

export interface Pagination {
  pageNumber?: number
  pageSize?: number
}

export type SortDirection = "asc" | "desc"

export interface SortState {
  column?: string | null
  direction?: SortDirection | null
}

export interface FilterValue {
  column: string
  value: string | string[]
  operator?:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "in"
    | "range"
    | "from"
    | "to"
}

type ClickFunc<T> = (
  row: T,
  otherPanel: boolean,
  event?: React.MouseEvent
) => void

export interface ColumnConfig<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  render?: (
    value: T[keyof T],
    row: T,
    onClick?: ClickFunc<T>
  ) => React.ReactNode
  clickable?: boolean
}

export interface TableState<T> {
  data: T[]
  sorting: SortState
  columns: ColumnConfig<T>[]
  loading?: boolean
}

export interface TableActions<T> {
  setSorting: (sort: SortState) => void
  setColumns: (columns: ColumnConfig<T>[]) => void
  toggleColumnVisibility: (columnKey: keyof T) => void
}

export interface UseTableDataProps<T> {
  initialData?: PaginatedResponse<T>
  initialColumns: ColumnConfig<T>[]
  onDataChange?: (state: {sorting: SortState}) => void
}
