import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"

import {useGetPaginatedDocumentsByCategoryQuery} from "@/features/documents-by-category/storage/api"
import {
  selectDocumentCategoryID,
  selectDocumentsByCategoryPageNumber,
  selectDocumentsByCategoryPageSize,
  selectDocumentsByCategorySorting
} from "@/features/documents-by-category/storage/documentsByCategory"
import type {
  DocumentsByCategoryQueryParams,
  SortBy
} from "@/features/documents-by-category/types"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
import {useContext} from "react"

export default function useDocumentsByCategoryTable() {
  const queryParams = useQueryParams()
  const mode: PanelMode = useContext(PanelContext)
  const categoryID = useAppSelector(s => selectDocumentCategoryID(s, mode))

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

function useQueryParams(): DocumentsByCategoryQueryParams {
  const mode = usePanelMode()
  const pageSize =
    useAppSelector(s => selectDocumentsByCategoryPageSize(s, mode)) || 10
  const pageNumber =
    useAppSelector(s => selectDocumentsByCategoryPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectDocumentsByCategorySorting(s, mode))
  const column = sorting?.column as SortBy | undefined

  const queryParams: DocumentsByCategoryQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined
  }

  return queryParams
}
