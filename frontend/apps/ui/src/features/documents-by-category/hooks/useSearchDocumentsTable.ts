import {useAppSelector} from "@/app/hooks"
import {useSearchDocumentsMutation} from "@/features/documents-by-category/storage/api"
import {buildSearchQueryParams} from "@/features/documents-by-category/utils/searchHelper"
import type {SearchQueryParams} from "@/features/search/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useEffect} from "react"

export default function useSearchDocumentsTable() {
  const {panelId} = usePanel()

  // Get search tokens from Redux
  const searchTokens = useAppSelector(state => state.search.tokens)

  // Get pagination and sorting from panel state
  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))

  // Use the mutation hook
  const [searchDocuments, {data, isLoading, isFetching, isError, error}] =
    useSearchDocumentsMutation()

  // Trigger search when tokens change or pagination changes
  useEffect(() => {
    if (searchTokens.length === 0) {
      // No tokens = no search (will fall back to flat list)
      return
    }

    // Build search params from tokens
    const searchParams: SearchQueryParams = buildSearchQueryParams({
      tokens: searchTokens,
      pageNumber,
      pageSize,
      sorting
    })

    // Execute search
    searchDocuments(searchParams)
  }, [searchTokens, pageNumber, pageSize, sorting])

  return {
    data,
    isLoading,
    isFetching,
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
