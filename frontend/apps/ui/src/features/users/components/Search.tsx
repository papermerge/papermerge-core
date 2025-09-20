import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectUserFreeTextFilterValue,
  selectUserWithRolesFilterValue,
  selectUserWithoutRolesFilterValue,
  usersTableFiltersUpdated
} from "@/features/users/storage/user"
import {usePanelMode} from "@/hooks"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import FilterByRoles from "./FilterByRoles"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const mode = usePanelMode()

  const dispatch = useAppDispatch()

  const searchText = useAppSelector(s => selectUserFreeTextFilterValue(s, mode))
  const withRoles = useAppSelector(s => selectUserWithRolesFilterValue(s, mode))
  const withoutRoles = useAppSelector(s =>
    selectUserWithoutRolesFilterValue(s, mode)
  )

  const [localWithRoles, setLocalWithRoles] = useState<string[]>(
    withRoles || []
  )
  const [localWithoutRoles, setLocalWithoutRoles] = useState<string[]>(
    withoutRoles || []
  )

  const [localSearchTextValue, setSearchTextValue] = useState(searchText || "")
  const [debouncedSearchTextValue, setDebouncedSearchTextValue] = useState(
    searchText || ""
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTextValue(localSearchTextValue)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [localSearchTextValue])

  useEffect(() => {
    onSearch?.()
  }, [debouncedSearchTextValue])

  const onLocalWithRoleChange = (value?: string[] | null) => {
    setLocalWithRoles(value || [])
  }

  const onLocalWithoutRoleChange = (value?: string[] | null) => {
    setLocalWithoutRoles(value || [])
  }

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTextValue(e.currentTarget.value)
  }

  const onClearSearchText = () => {
    setSearchTextValue("")
  }

  const onSearch = () => {
    dispatch(
      usersTableFiltersUpdated({
        mode,
        freeTextFilterValue: debouncedSearchTextValue,
        withRolesFilterValue: localWithRoles,
        withoutRolesFilterValue: localWithoutRoles
      })
    )
  }

  const onClear = () => {
    dispatch(
      usersTableFiltersUpdated({
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
      placeholder={t?.("searchUsers", {defaultValue: "Search users..."})}
    >
      <FilterByRoles
        label={t?.("usersFilter.ByRole.WithRoles", {
          defaultValue: "User has these roles"
        })}
        onChange={onLocalWithRoleChange}
        roles={localWithRoles}
      />
      <FilterByRoles
        label={t?.("usersFilter.ByRole.WithoutRoles", {
          defaultValue: "User does NOT have these roles"
        })}
        onChange={onLocalWithoutRoleChange}
        roles={localWithoutRoles}
      />
    </SearchContainer>
  )
}
