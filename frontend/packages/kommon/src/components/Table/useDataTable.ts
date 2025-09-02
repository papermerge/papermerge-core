// hooks/useTableData.ts
import {useEffect, useState} from "react"
import {
  ColumnConfig,
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
    sorting: {column: null, direction: null},
    columns: initialColumns.map(col => ({
      ...col,
      visible: col.visible !== false
    })),
    loading: false
  }))

  const setSorting = (sorting: SortState) => {
    setState(prev => ({...prev, sorting}))
  }

  const setColumns = (columns: ColumnConfig<T>[]) => {
    setState(prev => ({...prev, columns}))
  }

  const toggleColumnVisibility = (columnKey: keyof T) => {
    setState(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.key === columnKey ? {...col, visible: !col.visible} : col
      )
    }))
  }

  const updateData = (newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,

      loading: false
    }))
  }

  const setLoading = (loading: boolean) => {
    setState(prev => ({...prev, loading}))
  }

  // Notify parent component when state changes that affect data fetching
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        sorting: state.sorting
      })
    }
  }, [state.sorting, onDataChange])

  const actions: TableActions<T> = {
    setSorting,
    setColumns,
    toggleColumnVisibility
  }

  return {
    state,
    actions,
    updateData,
    setLoading,
    // Computed values
    visibleColumns: state.columns.filter(col => col.visible !== false),
    totalItems: 33
  }
}
