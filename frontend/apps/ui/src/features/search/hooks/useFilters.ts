import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {Filter} from "@/features/search/microcomp/types"
import {
  addFilter as addFilterAction,
  clearFilters as clearFiltersAction,
  removeFilter as removeFilterAction,
  setFilters as setFiltersAction,
  updateFilter as updateFilterAction
} from "@/features/search/storage/search"
import {useCallback} from "react"

export function useFilters() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(state => state.search.filters)

  const addFilter = useCallback(
    (filter: Filter) => {
      dispatch(addFilterAction(filter))
    },
    [dispatch]
  )

  const updateFilter = useCallback(
    (index: number, updates: Partial<Filter>) => {
      dispatch(updateFilterAction({index, updates}))
    },
    [dispatch]
  )

  const removeFilter = useCallback(
    (index: number) => {
      dispatch(removeFilterAction(index))
    },
    [dispatch]
  )

  const clearFilters = useCallback(() => {
    dispatch(clearFiltersAction())
  }, [dispatch])

  const setFilters = useCallback(
    (tokens: Filter[]) => {
      dispatch(setFiltersAction(tokens))
    },
    [dispatch]
  )

  return {
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    setFilters
  }
}
