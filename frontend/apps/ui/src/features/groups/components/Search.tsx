import {useAppDispatch, useAppSelector} from "@/app/hooks"
import FilterByUser from "@/components/FilterByUser"
import {
  groupsTableFiltersUpdated,
  selectGroupFreeTextFilterValue,
  selectGroupWithoutUsersFilterValue,
  selectGroupWithUsersFilterValue
} from "@/features/groups/storage/group"
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
    selectGroupFreeTextFilterValue(s, mode)
  )
  const withUsers = useAppSelector(s =>
    selectGroupWithUsersFilterValue(s, mode)
  )
  const withoutUsers = useAppSelector(s =>
    selectGroupWithoutUsersFilterValue(s, mode)
  )

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
      groupsTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue,
        withUsersFilterValue: localWithUsers,
        withoutUsersFilterValue: localWithoutUsers
      })
    )
  }

  const onClear = () => {
    setLocalWithUsers([])
    setLocalWithoutUsers([])

    dispatch(
      groupsTableFiltersUpdated({
        mode,
        freeTextFilterValue: undefined,
        withUsersFilterValue: undefined,
        withoutUsersFilterValue: undefined
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
      placeholder={t?.("searchGroups", {defaultValue: "Search groups..."})}
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
