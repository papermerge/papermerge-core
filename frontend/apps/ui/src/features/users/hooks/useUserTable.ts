import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useGetPaginatedUsersQuery} from "@/features/users/storage/api"
import type {SortBy, UserQueryParams} from "@/features/users/types"

function useQueryParams(): UserQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.freeText
  const with_roles = filters.withRoles
  const without_roles = filters.withoutRoles
  const with_groups = filters.withGroups
  const without_groups = filters.withoutGroups
  const with_scopes = filters.withScopes
  const without_scopes = filters.withoutScopes

  const queryParams: UserQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text,
    filter_with_roles: with_roles?.join(","),
    filter_without_roles: without_roles?.join(","),
    filter_with_groups: with_groups?.join(","),
    filter_without_groups: without_groups?.join(","),
    filter_with_scopes: with_scopes?.join(","),
    filter_without_scopes: without_scopes?.join(",")
  }

  return queryParams
}

export default function useUserTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedUsersQuery(queryParams)

  return {data, isLoading, isFetching, isError, error, queryParams}
}
