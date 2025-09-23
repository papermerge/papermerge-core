import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedGroupsQuery} from "@/features/groups/storage/api"
import {
  selectGroupFreeTextFilterValue,
  selectGroupPageNumber,
  selectGroupPageSize,
  selectGroupSorting,
  selectGroupWithoutUsersFilterValue,
  selectGroupWithUsersFilterValue
} from "@/features/groups/storage/group"
import type {GroupQueryParams, SortBy} from "@/features/groups/types"
import {usePanelMode} from "@/hooks"

function useQueryParams(): GroupQueryParams {
  const mode = usePanelMode()
  const pageSize = useAppSelector(s => selectGroupPageSize(s, mode)) || 10
  const pageNumber = useAppSelector(s => selectGroupPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectGroupSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s => selectGroupFreeTextFilterValue(s, mode))
  const with_users = useAppSelector(s =>
    selectGroupWithUsersFilterValue(s, mode)
  )
  const without_users = useAppSelector(s =>
    selectGroupWithoutUsersFilterValue(s, mode)
  )

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
