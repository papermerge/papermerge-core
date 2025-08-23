// hooks/useTableData.ts
import {useCallback, useEffect, useState} from "react"
import {
  ColumnConfig,
  FilterValue,
  SortState,
  TableActions,
  TableState,
  UseTableDataProps
} from "./types"

export default function useTableData<T>({
  initialData,
  initialColumns,
  onDataChange
}: UseTableDataProps<T>) {
  const [state, setState] = useState<TableState<T>>(() => ({
    data: initialData?.items || [],
    pagination: {
      page: initialData?.page_number || 1,
      pageSize: initialData?.page_size || 15,
      totalPages: initialData?.num_pages || 1
    },
    sorting: {column: null, direction: null},
    filters: [],
    columns: initialColumns.map(col => ({
      ...col,
      visible: col.visible !== false
    })),
    columnWidths: {},
    loading: false
  }))

  const setSorting = useCallback((sorting: SortState) => {
    setState(prev => ({...prev, sorting}))
  }, [])

  const setFilters = useCallback((filters: FilterValue[]) => {
    setState(prev => ({
      ...prev,
      filters,
      pagination: {...prev.pagination, page: 1} // Reset to first page when filtering
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: {...prev.pagination, page}
    }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        pageSize,
        page: 1 // Reset to first page when changing page size
      }
    }))
  }, [])

  const setColumns = useCallback((columns: ColumnConfig<T>[]) => {
    setState(prev => ({...prev, columns}))
  }, [])

  const setColumnWidth = useCallback((columnKey: string, width: number) => {
    setState(prev => ({
      ...prev,
      columnWidths: {...prev.columnWidths, [columnKey]: width}
    }))
  }, [])

  const toggleColumnVisibility = useCallback((columnKey: keyof T) => {
    setState(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.key === columnKey ? {...col, visible: !col.visible} : col
      )
    }))
  }, [])

  const updateData = useCallback(
    (
      newData: T[],
      pagination?: {
        page_number: number
        page_size: number
        num_pages: number
      }
    ) => {
      setState(prev => ({
        ...prev,
        data: newData,
        pagination: pagination
          ? {
              page: pagination.page_number,
              pageSize: pagination.page_size,
              totalPages: pagination.num_pages
            }
          : prev.pagination,
        loading: false
      }))
    },
    []
  )

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({...prev, loading}))
  }, [])

  // Notify parent component when state changes that affect data fetching
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        sorting: state.sorting,
        filters: state.filters
      })
    }
  }, [
    state.pagination.page,
    state.pagination.pageSize,
    state.sorting,
    state.filters,
    onDataChange
  ])

  const actions: TableActions<T> = {
    setSorting,
    setFilters,
    setPage,
    setPageSize,
    setColumns,
    setColumnWidth,
    toggleColumnVisibility
  }

  return {
    state,
    actions,
    updateData,
    setLoading,
    // Computed values
    visibleColumns: state.columns.filter(col => col.visible !== false),
    totalItems: state.pagination.totalPages * state.pagination.pageSize // Approximate
  }
}

// Hook for column resizing
export function useColumnResize() {
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const startResize = useCallback(
    (columnKey: string, startX: number, startWidth: number) => {
      setIsResizing(columnKey)
      setStartX(startX)
      setStartWidth(startWidth)
    },
    []
  )

  const stopResize = useCallback(() => {
    setIsResizing(null)
    setStartX(0)
    setStartWidth(0)
  }, [])

  const getNewWidth = useCallback(
    (currentX: number) => {
      return Math.max(50, startWidth + (currentX - startX)) // Minimum width of 50px
    },
    [startX, startWidth]
  )

  return {
    isResizing,
    startResize,
    stopResize,
    getNewWidth
  }
}
