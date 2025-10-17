import {useAppDispatch, useAppSelector} from "@/app/hooks"
import FilterByDataType from "@/components/FilterByCustomFieldDataType"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  updatePanelFilters
} from "@/features/ui/panelRegistry"

import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const {panelId} = usePanel()

  const dispatch = useAppDispatch()

  const filters = useAppSelector(s => selectPanelFilters(s, panelId))
  const searchText = filters.freeText
  const cfTypes = filters.cfTypes

  const [localTypes, setLocalTypes] = useState<string[]>(cfTypes || [])
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

  const onLocalTypesChange = (value: string[] | null) => {
    setLocalTypes(value || [])
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
          cfTypes: localTypes
        }
      })
    )
  }

  const onClear = () => {
    setLocalTypes([])

    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          freeText: undefined,
          cfTypes: undefined
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
      placeholder={t?.("customFields.searchLabel", {
        defaultValue: "Search custom fields..."
      })}
    >
      <FilterByDataType
        t={t}
        onChange={onLocalTypesChange}
        selectedDataTypes={localTypes}
        label={t?.("customFields.filterByType.label") ?? "Types"}
      />
    </SearchContainer>
  )
}
