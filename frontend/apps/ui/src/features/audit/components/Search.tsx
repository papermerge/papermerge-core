import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {AuditOperation, TimestampFilterType} from "@/features/audit/types"
import {
  auditLogTableFiltersUpdated,
  selectAuditLogOperationFilterValue,
  selectAuditLogTableNameFilterValue,
  selectAuditLogUsernameFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useState} from "react"
import OperationFilter from "./OperationFilter"
import SearchContainer from "./SearchContainer"
import TableNameFilter from "./TableNameFilter"
import TimestampFilter from "./TimestampFilter"
import UserFilter from "./UserFilter"

export default function Search() {
  const mode = usePanelMode()

  const dispatch = useAppDispatch()
  const tableNames = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )
  const users = useAppSelector(s => selectAuditLogUsernameFilterValue(s, mode))
  const [localTableNames, setLocalTableNames] = useState<string[]>(
    tableNames || []
  )
  const [localOperations, setLocalOperations] = useState<AuditOperation[]>(
    operations || []
  )
  const [localRange, setLocalRange] = useState<TimestampFilterType>()
  const [localUsers, setLocalUsers] = useState<string[]>(users || [])

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

  const onSearch = () => {
    dispatch(
      auditLogTableFiltersUpdated({
        mode,
        tableNameFilterValue: localTableNames,
        operationFilterValue: localOperations,
        timestampFilterValue: localRange,
        usernameFilterValue: localUsers
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
        usernameFilterValue: undefined
      })
    )
  }

  return (
    <SearchContainer onClear={onClear} onSearch={onSearch}>
      <TimestampFilter range={localRange} onChange={onLocalRangeChange} />
      <TableNameFilter
        tableNames={localTableNames}
        onChange={onLocalTableNamesChange}
      />
      <OperationFilter
        operations={localOperations}
        onChange={onLocalOperationChange}
      />
      <UserFilter users={localUsers} onChange={onLocalUserChange} />
    </SearchContainer>
  )
}
