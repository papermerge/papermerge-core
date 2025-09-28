import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  documentTypesTableFiltersUpdated,
  selectDocumentTypeFreeTextFilterValue
} from "@/features/document-types/storage/documentType"
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
    selectDocumentTypeFreeTextFilterValue(s, mode)
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

  const onClearSearchText = () => {
    setSearchTextValue("")
  }

  const onSearch = () => {
    dispatch(
      documentTypesTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue
      })
    )
  }

  const onClear = () => {
    dispatch(
      documentTypesTableFiltersUpdated({
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
      placeholder={t?.("documentTypes.searchLabel", {
        defaultValue: "Search categories..."
      })}
    ></SearchContainer>
  )
}
