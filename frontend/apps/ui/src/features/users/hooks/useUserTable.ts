import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedUsersQuery} from "@/features/users/storage/api"
import {
  selectUserFreeTextFilterValue,
  selectUserPageNumber,
  selectUserPageSize,
  selectUserSorting
} from "@/features/users/storage/user"
import type {SortBy, UserQueryParams} from "@/features/users/types"
import {usePanelMode} from "@/hooks"

function useQueryParams(): UserQueryParams {
  const mode = usePanelMode()
  const pageSize = useAppSelector(s => selectUserPageSize(s, mode)) || 10
  const pageNumber = useAppSelector(s => selectUserPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectUserSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s => selectUserFreeTextFilterValue(s, mode))

  const queryParams: UserQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text
  }

  return queryParams
}

export default function useUserTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedUsersQuery(queryParams)

  return {data, isLoading, isFetching, isError, error, queryParams}
}
