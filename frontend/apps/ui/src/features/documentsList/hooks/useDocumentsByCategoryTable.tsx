import {useAppSelector} from "@/app/hooks"

import {useGetPaginatedDocumentsByCategoryQuery} from "@/features/documentsList/storage/api"
import type {
  DocumentsByCategoryQueryParams,
  SortBy
} from "@/features/documentsList/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {selectDocumentCategoryID} from "../storage/documentsByCategory"

function useQueryParams(): DocumentsByCategoryQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined

  const queryParams: DocumentsByCategoryQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined
  }

  return queryParams
}

export default function useDocumentsByCategoryTable() {
  const queryParams = useQueryParams()
  const categoryID = useAppSelector(selectDocumentCategoryID)

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedDocumentsByCategoryQuery(
      {
        document_type_id: categoryID!,
        params: queryParams
      },
      {
        skip: !categoryID || categoryID === ""
      }
    )

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
