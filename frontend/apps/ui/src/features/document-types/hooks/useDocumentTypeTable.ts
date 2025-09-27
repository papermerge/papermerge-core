import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedDocumentTypesQuery} from "@/features/document-types/storage/api"
import {
  selectDocumentTypeFreeTextFilterValue,
  selectDocumentTypePageNumber,
  selectDocumentTypePageSize,
  selectDocumentTypeSorting,
  selectDocumentTypeWithoutUsersFilterValue,
  selectDocumentTypeWithUsersFilterValue
} from "@/features/document-types/storage/documentType"
import type {
  DocumentTypeQueryParams,
  SortBy
} from "@/features/document-types/types"
import {usePanelMode} from "@/hooks"

function useQueryParams(): DocumentTypeQueryParams {
  const mode = usePanelMode()
  const pageSize =
    useAppSelector(s => selectDocumentTypePageSize(s, mode)) || 10
  const pageNumber =
    useAppSelector(s => selectDocumentTypePageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectDocumentTypeSorting(s, mode))
  const column = sorting?.column as SortBy | undefined
  const free_text = useAppSelector(s =>
    selectDocumentTypeFreeTextFilterValue(s, mode)
  )
  const with_users = useAppSelector(s =>
    selectDocumentTypeWithUsersFilterValue(s, mode)
  )
  const without_users = useAppSelector(s =>
    selectDocumentTypeWithoutUsersFilterValue(s, mode)
  )

  const queryParams: DocumentTypeQueryParams = {
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

export default function useDocumentTypeTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedDocumentTypesQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
