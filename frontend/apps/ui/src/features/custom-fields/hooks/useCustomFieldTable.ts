import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {
  selectCustomFieldFreeTextFilterValue,
  selectCustomFieldPageNumber,
  selectCustomFieldPageSize,
  selectCustomFieldSorting,
  selectCustomFieldTypesFilterValue
} from "@/features/custom-fields/storage/custom_field"
import type {
  CustomFieldQueryParams,
  SortBy
} from "@/features/custom-fields/types"
import {usePanelMode} from "@/hooks"

function useQueryParams(): CustomFieldQueryParams {
  const mode = usePanelMode()
  const pageSize = useAppSelector(s => selectCustomFieldPageSize(s, mode)) || 10
  const pageNumber =
    useAppSelector(s => selectCustomFieldPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectCustomFieldSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s =>
    selectCustomFieldFreeTextFilterValue(s, mode)
  )
  const cf_types = useAppSelector(s =>
    selectCustomFieldTypesFilterValue(s, mode)
  )

  const queryParams: CustomFieldQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text,
    filter_types: cf_types?.join(",")
  }

  return queryParams
}

export default function useCustomFieldTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedCustomFieldsQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
