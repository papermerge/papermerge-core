import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  rolesTableFiltersUpdated,
  selectRoleExcludeScopeFilterValue,
  selectRoleFreeTextFilterValue,
  selectRoleIncludeScopeFilterValue
} from "@/features/roles/storage/role"
import {usePanelMode} from "@/hooks"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import InScopeFilter from "./InScopeFilter"
import NotInScopeFilter from "./NotInScopeFilter"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const mode = usePanelMode()

  const dispatch = useAppDispatch()

  const searchText = useAppSelector(s => selectRoleFreeTextFilterValue(s, mode))
  const includeScopes = useAppSelector(s =>
    selectRoleIncludeScopeFilterValue(s, mode)
  )
  const excludeScopes = useAppSelector(s =>
    selectRoleExcludeScopeFilterValue(s, mode)
  )

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
      rolesTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue,
        includeScopeFilterValue: localIncludeScopes,
        excludeScopeFilterValue: localExcludeScopes
      })
    )
  }

  const onClear = () => {
    setLocalExcludeScopes([])
    setLocalIncludeScopes([])

    dispatch(
      rolesTableFiltersUpdated({
        mode,
        freeTextFilterValue: undefined,
        includeScopeFilterValue: undefined,
        excludeScopeFilterValue: undefined
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
      <InScopeFilter
        t={t}
        onChange={onLocalIncludeScopeChange}
        scopes={localIncludeScopes}
      />
      <NotInScopeFilter
        t={t}
        onChange={onLocalExcludeScopeChange}
        scopes={localExcludeScopes}
      />
    </SearchContainer>
  )
}
