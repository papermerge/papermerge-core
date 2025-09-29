import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectTagFreeTextFilterValue,
  tagsTableFiltersUpdated
} from "@/features/tags/storage/tag"
import {usePanelMode} from "@/hooks"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const mode = usePanelMode()

  const dispatch = useAppDispatch()

  const searchText = useAppSelector(s => selectTagFreeTextFilterValue(s, mode))

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
      tagsTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue
      })
    )
  }

  const onClear = () => {
    dispatch(
      tagsTableFiltersUpdated({
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
      placeholder={t?.("tags.searchTags", {
        defaultValue: "Search tags..."
      })}
    />
  )
}
