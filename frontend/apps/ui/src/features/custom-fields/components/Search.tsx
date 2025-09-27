import {useAppDispatch, useAppSelector} from "@/app/hooks"
import FilterByDataType from "@/components/FilterByCustomFieldDataType"
import {
  customFieldsTableFiltersUpdated,
  selectCustomFieldFreeTextFilterValue,
  selectCustomFieldTypesFilterValue
} from "@/features/custom-fields/storage/custom_field"
import {usePanelMode} from "@/hooks"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const mode = usePanelMode()

  const dispatch = useAppDispatch()

  const searchText = useAppSelector(s =>
    selectCustomFieldFreeTextFilterValue(s, mode)
  )
  const cfTypes = useAppSelector(s =>
    selectCustomFieldTypesFilterValue(s, mode)
  )

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
      customFieldsTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue,
        typesFilterValue: localTypes
      })
    )
  }

  const onClear = () => {
    setLocalTypes([])

    dispatch(
      customFieldsTableFiltersUpdated({
        mode,
        freeTextFilterValue: undefined,
        typesFilterValue: undefined
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
