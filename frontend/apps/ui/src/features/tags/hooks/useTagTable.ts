import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedTagsQuery} from "@/features/tags/storage/api"
import {
  selectTagFreeTextFilterValue,
  selectTagPageNumber,
  selectTagPageSize,
  selectTagSorting
} from "@/features/tags/storage/tag"
import type {SortBy, TagQueryParams} from "@/features/tags/types"
import {usePanelMode} from "@/hooks"

function useQueryParams(): TagQueryParams {
  const mode = usePanelMode()
  const pageSize = useAppSelector(s => selectTagPageSize(s, mode)) || 10
  const pageNumber = useAppSelector(s => selectTagPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectTagSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s => selectTagFreeTextFilterValue(s, mode))

  const queryParams: TagQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text
  }

  return queryParams
}

export default function useTagTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedTagsQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
