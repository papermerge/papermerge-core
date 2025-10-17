import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedGroupsQuery} from "@/features/groups/storage/api"
import type {GroupQueryParams, SortBy} from "@/features/groups/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"

function useQueryParams(): GroupQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.free_text || []
  const with_users = filters.with_users || []
  const without_users = filters.without_users || []

  const queryParams: GroupQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text,
    filter_with_users: with_users?.join(","),
    filter_without_users: without_users?.join(",")
  }

  return queryParams
}

export default function useGroupTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedGroupsQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
