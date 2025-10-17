import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedDocumentTypesQuery} from "@/features/document-types/storage/api"
import type {
  DocumentTypeQueryParams,
  SortBy
} from "@/features/document-types/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"

function useQueryParams(): DocumentTypeQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.freeText
  const with_users = filters.withUsers
  const without_users = filters.withoutUsers

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
