import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {TimestampFilterType} from "@/features/audit/types"
import {
  rolesTableFiltersUpdated,
  selectRoleFreeTextFilterValue
} from "@/features/roles/storage/role"
import {usePanelMode} from "@/hooks"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const mode = usePanelMode()

  const dispatch = useAppDispatch()

  const searchText = useAppSelector(s => selectRoleFreeTextFilterValue(s, mode))
  const [localRange, setLocalRange] = useState<TimestampFilterType>()
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

  const onLocalRangeChange = (value: TimestampFilterType) => {
    setLocalRange(value)
  }

  const onLocalUserChange = (value: string[] | null) => {}

  const onClearSearchText = () => {
    setSearchTextValue("")
  }

  const onSearch = () => {
    dispatch(
      rolesTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue
      })
    )
  }

  const onClear = () => {
    dispatch(
      rolesTableFiltersUpdated({
        mode,
        freeTextFilterValue: undefined
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
      {"Filters here"}
    </SearchContainer>
  )
}
