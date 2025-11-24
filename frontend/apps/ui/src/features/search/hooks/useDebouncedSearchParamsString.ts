import {useAppSelector} from "@/app/hooks"
import {DEBOUNCE_SEARCH_WAIT_TIME_MS} from "@/cconstants"
import {uniqueSearchString} from "@/features/documentsList/utils/searchHelper"
import {useDebouncedValue} from "@mantine/hooks"

interface ReturnValue {
  relevantParamsString: string
  filtersCount: number
}

export default function useDebouncedSearchParamsString(): ReturnValue {
  const searchTokens = useAppSelector(state => state.search.filters)
  const [debouncedSearchTokens] = useDebouncedValue(
    searchTokens,
    DEBOUNCE_SEARCH_WAIT_TIME_MS,
    {leading: true}
  )
  const relevantParamsString = uniqueSearchString(debouncedSearchTokens)

  return {relevantParamsString, filtersCount: debouncedSearchTokens.length}
}
