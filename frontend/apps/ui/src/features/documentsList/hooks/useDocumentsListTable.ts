import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useSearchDocumentsMutation} from "@/features/documentsList/storage/api"
import {documentCategoryIDUpdated} from "@/features/documentsList/storage/documentsByCategory"
import {buildSearchQueryParams} from "@/features/documentsList/utils/searchHelper"
import type {SearchQueryParams} from "@/features/search/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useDebouncedValue} from "@mantine/hooks"
import {useEffect} from "react"

const DEBOUNCE_WAIT_TIME_MS = 600 // miliseconds

export default function useDocumentsListTable() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()

  // Get search tokens from Redux
  const searchTokens = useAppSelector(state => state.search.filters)

  // Get pagination and sorting from panel state
  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))

  // Use the mutation hook
  const [searchDocuments, {data, isLoading, isError, error}] =
    useSearchDocumentsMutation()

  const [debouncedSearchTokens] = useDebouncedValue(
    searchTokens,
    DEBOUNCE_WAIT_TIME_MS,
    {leading: true}
  )

  // Trigger search when tokens change or pagination changes
  useEffect(() => {
    // Build search params from tokens
    const searchParams: SearchQueryParams = buildSearchQueryParams({
      filters: debouncedSearchTokens,
      pageNumber,
      pageSize,
      sorting
    })

    // Execute search
    searchDocuments(searchParams)
  }, [debouncedSearchTokens, pageNumber, pageSize, sorting])

  // Update document_type_id when data changes
  useEffect(() => {
    if (data && "document_type_id" in data && data.document_type_id) {
      dispatch(documentCategoryIDUpdated(data.document_type_id))
    } else {
      // Clear document_type_id when it's a flat search
      dispatch(documentCategoryIDUpdated(null))
    }
  }, [data, dispatch])

  return {
    data,
    isLoading,
    isFetching: false,
    isError,
    error,
    queryParams: {
      page_number: pageNumber,
      page_size: pageSize,
      sort_by: sorting?.column,
      sort_direction: sorting?.direction || undefined
    }
  }
}
