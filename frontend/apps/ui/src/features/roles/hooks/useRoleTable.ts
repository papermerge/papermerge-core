import {useAppSelector} from "@/app/hooks"
import type {RoleQueryParams, SortBy} from "@/features/roles/types"
import {
  selectRoleFreeTextFilterValue,
  selectRolePageNumber,
  selectRolePageSize,
  selectRoleSorting
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useGetPaginatedRolesQuery} from "../apiSlice"

function useQueryParams(): RoleQueryParams {
  const mode = usePanelMode()
  const pageSize = useAppSelector(s => selectRolePageSize(s, mode)) || 10
  const pageNumber = useAppSelector(s => selectRolePageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectRoleSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s => selectRoleFreeTextFilterValue(s, mode))

  const queryParams: RoleQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text
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
