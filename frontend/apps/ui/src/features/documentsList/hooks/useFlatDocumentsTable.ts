import {useAppSelector} from "@/app/hooks"
import type {
  FlatDocumentSortBy,
  FlatDocumentsQueryParams
} from "@/features/documentsList/storage/api"
import {useGetPaginatedFlatDocumentsQuery} from "@/features/documentsList/storage/api"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {selectDocumentCategoryID} from "../storage/documentsByCategory"

function useQueryParams(): FlatDocumentsQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as FlatDocumentSortBy | undefined

  const queryParams: FlatDocumentsQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined
  }

  return queryParams
}

export default function useFlatDocumentsTable() {
  const queryParams = useQueryParams()
  const categoryID = useAppSelector(selectDocumentCategoryID)

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedFlatDocumentsQuery(queryParams, {
      skip: !!categoryID // Skip when categoryID is present
    })

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
