import {useAppDispatch, useAppSelector} from "@/app/hooks"
import FilterByUser from "@/components/FilterByUser"
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
  const withUsers = filters.withUsers
  const withoutUsers = filters.withoutUsers

  const [localWithUsers, setLocalWithUsers] = useState<string[]>(
    withUsers || []
  )
  const [localWithoutUsers, setLocalWithoutUsers] = useState<string[]>(
    withoutUsers || []
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

  const onLocalWithUsersChange = (value: string[] | null) => {
    setLocalWithUsers(value || [])
  }

  const onLocalWithoutUsersChange = (value?: string[] | null) => {
    setLocalWithoutUsers(value || [])
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
          withUsers: localWithUsers,
          withoutUsers: localWithoutUsers
        }
      })
    )
  }

  const onClear = () => {
    setLocalWithUsers([])
    setLocalWithoutUsers([])

    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          freeText: undefined,
          withUsers: undefined,
          withoutUsers: undefined
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
      placeholder={t?.("groups.searchGroups", {
        defaultValue: "Search groups..."
      })}
    >
      <FilterByUser
        t={t}
        onChange={onLocalWithUsersChange}
        users={localWithUsers}
        label={
          t?.("groups.filterByUser.label.withUsers") ?? "Includes these users"
        }
      />
      <FilterByUser
        t={t}
        label={
          t?.("groups.filterByUser.label.withoutUsers") ??
          "Does NOT include these users"
        }
        onChange={onLocalWithoutUsersChange}
        users={localWithoutUsers}
      />
    </SearchContainer>
  )
}
