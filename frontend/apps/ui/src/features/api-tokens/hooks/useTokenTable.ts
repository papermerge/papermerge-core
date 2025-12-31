import {useAppSelector} from "@/app/hooks"
import type {SortBy, TokenQueryParams} from "@/features/api-tokens/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useGetPaginatedAPITokensQuery} from "../apiSlice"

function useQueryParams(): TokenQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 15
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.freeText

  const queryParams: TokenQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text
  }

  return queryParams
}

export default function useTokenTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAPITokensQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
