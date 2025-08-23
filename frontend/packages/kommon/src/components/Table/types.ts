export interface PaginatedResponse<T> {
  page_size: number
  page_number: number
  num_pages: number
  items: T[]
}

export interface SortState {
  column: string | null
  direction: "asc" | "desc" | null
}

export interface FilterValue {
  column: string
  value: string | string[]
  operator?: "equals" | "contains" | "in" | "startsWith" | "endsWith"
}

export interface ColumnConfig<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface TableState<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
  }
  sorting: SortState
  filters: FilterValue[]
  columns: ColumnConfig<T>[]
  columnWidths: Record<string, number>
  loading?: boolean
}

export interface TableActions<T> {
  setSorting: (sort: SortState) => void
  setFilters: (filters: FilterValue[]) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setColumns: (columns: ColumnConfig<T>[]) => void
  setColumnWidth: (columnKey: string, width: number) => void
  toggleColumnVisibility: (columnKey: keyof T) => void
}

export interface UseTableDataProps<T> {
  initialData?: PaginatedResponse<T>
  initialColumns: ColumnConfig<T>[]
  onDataChange?: (state: {
    page: number
    pageSize: number
    sorting: SortState
    filters: FilterValue[]
  }) => void
}
