import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {AuditOperation, TimestampFilterType} from "@/features/audit/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  updatePanelFilters
} from "@/features/ui/panelRegistry"
import {SearchContainer} from "kommon"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import OperationFilter from "./OperationFilter"
import TableNameFilter from "./TableNameFilter"
import TimestampFilter from "./TimestampFilter"
import UserFilter from "./UserFilter"

const DEBOUNCE_MS = 300 // 300 miliseconds

export default function Search() {
  const {t} = useTranslation()
  const {panelId} = usePanel()

  const dispatch = useAppDispatch()
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))
  const tableNames = filters.tableNames
  const operations = filters.operations
  const users = filters.users
  const searchText = filters.freeText
  const [localTableNames, setLocalTableNames] = useState<string[]>(
    tableNames || []
  )

  const [localOperations, setLocalOperations] = useState<AuditOperation[]>(
    operations || []
  )
  const [localRange, setLocalRange] = useState<TimestampFilterType>()
  const [localUsers, setLocalUsers] = useState<string[]>(users || [])
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

  const onLocalTableNamesChange = (values: string[]) => {
    setLocalTableNames(values)
  }

  const onLocalOperationChange = (values: string[]) => {
    setLocalOperations(values as AuditOperation[])
  }

  const onLocalRangeChange = (value: TimestampFilterType) => {
    setLocalRange(value)
  }

  const onLocalUserChange = (value: string[] | null) => {
    if (value) {
      console.log(value)
      setLocalUsers(value)
    } else {
      setLocalUsers([])
    }
  }

  const onClearSearchText = () => {
    setSearchTextValue("")
  }

  const onSearch = () => {
    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          tableName: localTableNames,
          operation: localOperations,
          timestamp: localRange,
          username: localUsers,
          freeText: debouncedSearchTextValue
        }
      })
    )
  }

  const onClear = () => {
    setLocalTableNames([])
    setLocalOperations([])
    setLocalRange({from: null, to: null})
    setLocalUsers([])

    dispatch(
      updatePanelFilters({
        panelId,
        filters: {
          tableName: undefined,
          operation: undefined,
          timestamp: undefined,
          username: undefined,
          freeText: undefined
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
      placeholder={
        t?.("auditLog.searchLabel", {
          defaultValue: "Search audit logs..."
        }) || "Search audit logs..."
      }
      t={t}
    >
      <TimestampFilter t={t} range={localRange} onChange={onLocalRangeChange} />
      <TableNameFilter
        t={t}
        tableNames={localTableNames}
        onChange={onLocalTableNamesChange}
      />
      <OperationFilter
        t={t}
        operations={localOperations}
        onChange={onLocalOperationChange}
      />
      <UserFilter t={t} users={localUsers} onChange={onLocalUserChange} />
    </SearchContainer>
  )
}
