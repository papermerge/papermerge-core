import {useAppSelector} from "@/app/hooks"
import type {RoleQueryParams, SortBy} from "@/features/roles/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useGetPaginatedRolesQuery} from "../storage/api"

function useQueryParams(): RoleQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.freeText
  const include_scopes = filters.includeScopes
  const exclude_scopes = filters.excludeScopes

  const queryParams: RoleQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text,
    filter_include_scopes: include_scopes?.join(","),
    filter_exclude_scopes: exclude_scopes?.join(",")
  }

  return queryParams
}

export default function useRoleTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedRolesQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
