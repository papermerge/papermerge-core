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
import FilterByGroups from "./FilterByGroups"
import FilterByRoles from "./FilterByRoles"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const {panelId} = usePanel()

  const dispatch = useAppDispatch()

  const filters = useAppSelector(s => selectPanelFilters(s, panelId))
  const searchText = filters.freeText
  const withRoles = filters.withRoles
  const withoutRoles = filters.withoutRoles
  const withGroups = filters.withGroups
  const withoutGroups = filters.withoutGroups
  const withScopes = filters.withScopes
  const withoutScopes = filters.withoutScopes

  const [localWithRoles, setLocalWithRoles] = useState<string[]>(
    withRoles || []
  )
  const [localWithoutRoles, setLocalWithoutRoles] = useState<string[]>(
    withoutRoles || []
  )
  const [localWithGroups, setLocalWithGroups] = useState<string[]>(
    withGroups || []
  )
  const [localWithoutGroups, setLocalWithoutGroups] = useState<string[]>(
    withoutGroups || []
  )
  const [localWithScopes, setLocalWithScopes] = useState<string[]>(
    withScopes || []
  )
  const [localWithoutScopes, setLocalWithoutScopes] = useState<string[]>(
    withoutScopes || []
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

  const onLocalWithGroupChange = (value?: string[] | null) => {
    setLocalWithGroups(value || [])
  }

  const onLocalWithoutGroupChange = (value?: string[] | null) => {
    setLocalWithoutGroups(value || [])
  }

  const onLocalWithScopesChange = (value?: string[] | null) => {
    setLocalWithScopes(value || [])
  }

  const onLocalWithoutScopesChange = (value?: string[] | null) => {
    setLocalWithoutScopes(value || [])
  }

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTextValue(e.currentTarget.value)
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
          withRoles: localWithRoles,
          withoutRoles: localWithoutRoles,
          withGroups: localWithGroups,
          withoutGroups: localWithoutGroups,
          withScopes: localWithScopes,
          withoutScopes: localWithoutScopes
        }
      })
    )
  }

  const onClear = () => {
    setLocalWithRoles([])
    setLocalWithoutRoles([])
    setLocalWithGroups([])
    setLocalWithoutGroups([])
    setLocalWithScopes([])
    setLocalWithoutScopes([])
    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          freeText: undefined,
          withRoles: undefined,
          withoutRoles: undefined,
          withGroups: undefined,
          withoutGroups: undefined,
          withScopes: undefined,
          withoutScopes: undefined
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
      placeholder={t?.("users.searchLabel", {defaultValue: "Search users..."})}
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
      <FilterByGroups
        label={t?.("usersFilter.ByGroup.WithGroups", {
          defaultValue: "User is part of these groups"
        })}
        onChange={onLocalWithGroupChange}
        groups={localWithGroups}
      />
      <FilterByGroups
        label={t?.("usersFilter.ByGroup.WithoutGroups", {
          defaultValue: "User NOT is part of these groups"
        })}
        onChange={onLocalWithoutGroupChange}
        groups={localWithoutGroups}
      />
      <FilterByScope
        t={t}
        onChange={onLocalWithScopesChange}
        scopes={localWithScopes}
        label={t?.("scopeFilter.label.hasTheseScopes", {
          defaultValue: "Has these these scopes"
        })}
      />
      <FilterByScope
        t={t}
        label={t?.("scopeFilter.label.doesNotHaveTheseScopes", {
          defaultValue: "Does NOT have these scopes"
        })}
        onChange={onLocalWithoutScopesChange}
        scopes={localWithoutScopes}
      />
    </SearchContainer>
  )
}
