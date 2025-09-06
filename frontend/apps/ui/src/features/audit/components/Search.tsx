import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTableFiltersUpdated,
  selectAuditLogFreeTextFilterValue,
  selectAuditLogOperationFilterValue,
  selectAuditLogTableNameFilterValue,
  selectAuditLogUsernameFilterValue
} from "@/features/audit/storage/audit"
import type {AuditOperation, TimestampFilterType} from "@/features/audit/types"
import {usePanelMode} from "@/hooks"
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
  const mode = usePanelMode()

  const dispatch = useAppDispatch()
  const tableNames = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )
  const users = useAppSelector(s => selectAuditLogUsernameFilterValue(s, mode))
  const searchText = useAppSelector(s =>
    selectAuditLogFreeTextFilterValue(s, mode)
  )
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
      auditLogTableFiltersUpdated({
        mode,
        tableNameFilterValue: localTableNames,
        operationFilterValue: localOperations,
        timestampFilterValue: localRange,
        usernameFilterValue: localUsers,
        freeTextFilterValue: debouncedSearchTextValue
      })
    )
  }

  const onClear = () => {
    setLocalTableNames([])
    setLocalOperations([])
    setLocalRange({from: null, to: null})
    setLocalUsers([])

    dispatch(
      auditLogTableFiltersUpdated({
        mode,
        tableNameFilterValue: undefined,
        operationFilterValue: undefined,
        timestampFilterValue: undefined,
        usernameFilterValue: undefined,
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
