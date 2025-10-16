// features/roles/components/Search.tsx
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import FilterByScope from "@/components/FilterByScope"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  updatePanelFilters
} from "@/features/ui/panelRegistry"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

const DEBOUNCE_MS = 300 // 300 milliseconds

export default function Search() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()

  const filters = useAppSelector(s => selectPanelFilters(s, panelId))
  const searchText = filters.freeText
  const includeScopes = filters.includeScopes
  const excludeScopes = filters.excludeScopes

  const [localIncludeScopes, setLocalIncludeScopes] = useState<string[]>(
    includeScopes || []
  )
  const [localExcludeScopes, setLocalExcludeScopes] = useState<string[]>(
    excludeScopes || []
  )
  const [localSearchTextValue, setSearchTextValue] = useState(searchText || "")
  const [debouncedSearchTextValue, setDebouncedSearchTextValue] = useState(
    searchText || ""
  )

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTextValue(localSearchTextValue)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [localSearchTextValue])

  useEffect(() => {
    onSearch?.()
  }, [debouncedSearchTextValue])

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTextValue(e.currentTarget.value)
  }

  const onLocalIncludeScopeChange = (value: string[] | null) => {
    setLocalIncludeScopes(value || [])
  }

  const onLocalExcludeScopeChange = (value?: string[] | null) => {
    setLocalExcludeScopes(value || [])
  }

  const onClearSearchText = () => {
    setSearchTextValue("")
  }

  const onSearch = () => {
    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          freeText: debouncedSearchTextValue,
          includeScopes: localIncludeScopes,
          excludeScopes: localExcludeScopes
        }
      })
    )
  }

  const onClear = () => {
    setLocalExcludeScopes([])
    setLocalIncludeScopes([])
    setSearchTextValue("")

    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          freeText: undefined,
          includeScopes: undefined,
          excludeScopes: undefined
        }
      })
    )
  }

  return (
    <SearchContainer
      onTextChange={onTextChange}
      searchText={localSearchTextValue}
      onClearSearchText={onClearSearchText}
      onClear={onClear}
      onSearch={onSearch}
      t={t}
      placeholder={t?.("searchRoles") || "Search roles..."}
    >
      <FilterByScope
        t={t}
        onChange={onLocalIncludeScopeChange}
        scopes={localIncludeScopes}
        label={
          t?.("roles.scopeFilter.label.includes") ?? "Includes these scopes"
        }
      />
      <FilterByScope
        t={t}
        label={
          t?.("roles.scopeFilter.label.excludes") ?? "Excludes these scopes"
        }
        onChange={onLocalExcludeScopeChange}
        scopes={localExcludeScopes}
      />
    </SearchContainer>
  )
}
