import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {DEBOUNCE_SEARCH_WAIT_TIME_MS} from "@/cconstants"
import {useSearchDocumentsMutation} from "@/features/documentsList/storage/api"
import {buildSearchQueryParams} from "@/features/documentsList/utils/searchHelper"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import useDebouncedSearchParamsString from "@/features/search/hooks/useDebouncedSearchParamsString"
import type {SearchQueryParams} from "@/features/search/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import {useDebouncedValue} from "@mantine/hooks"
import {useEffect} from "react"

export default function useDocumentsListTable() {
  const {panelId, actions} = usePanel()
  const dispatch = useAppDispatch()

  // Get search tokens from Redux
  const searchTokens = useAppSelector(state => state.search.filters)

  // Get pagination and sorting from panel state
  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const myPreferences = useAppSelector(selectMyPreferences)

  // Use the mutation hook
  const [searchDocuments, {data, isLoading, isError, error}] =
    useSearchDocumentsMutation()

  const [debouncedSearchTokens] = useDebouncedValue(
    searchTokens,
    DEBOUNCE_SEARCH_WAIT_TIME_MS,
    {leading: true}
  )
  const {relevantParamsString} = useDebouncedSearchParamsString()

  // Trigger search when tokens change or pagination changes
  useEffect(() => {
    // Build search params from tokens
    const searchParams: SearchQueryParams = buildSearchQueryParams({
      filters: debouncedSearchTokens,
      pageNumber,
      pageSize,
      sorting,
      lang: myPreferences.search_lang
    })

    // Execute search
    searchDocuments(searchParams)
  }, [relevantParamsString, pageNumber, pageSize, sorting])

  useEffect(() => {
    // reset page number when search param change
    actions.updatePagination({pageNumber: 1})
  }, [relevantParamsString])

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
