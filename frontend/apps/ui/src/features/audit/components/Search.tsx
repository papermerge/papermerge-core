import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {AuditOperation, TimestampFilterType} from "@/features/audit/types"
import {
  auditLogTableFiltersUpdated,
  selectAuditLogOperationFilterValue,
  selectAuditLogTableNameFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useState} from "react"
import OperationFilter from "./OperationFilter2"
import SearchContainer from "./SearchContainer"
import TableNameFilter from "./TableNameFilter2"
import TimestampFilter from "./TimestampFilter2"

export default function Search() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const tableNames = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )
  const [localTableNames, setLocalTableNames] = useState<string[]>(
    tableNames || []
  )
  const [localOperations, setLocalOperations] = useState<AuditOperation[]>(
    operations || []
  )
  const [localRange, setLocalRange] = useState<TimestampFilterType>()

  const onLocalTableNamesChange = (values: string[]) => {
    setLocalTableNames(values)
  }

  const onLocalOperationChange = (values: string[]) => {
    setLocalOperations(values as AuditOperation[])
  }

  const onLocalRangeChange = (value: TimestampFilterType) => {
    setLocalRange(value)
  }

  const onSearch = () => {
    dispatch(
      auditLogTableFiltersUpdated({
        mode,
        tableNameFilterValue: localTableNames,
        operationFilterValue: localOperations,
        timestampFilterValue: localRange
      })
    )
  }

  const onClear = () => {
    setLocalTableNames([])
    setLocalOperations([])

    dispatch(
      auditLogTableFiltersUpdated({
        mode,
        tableNameFilterValue: undefined,
        operationFilterValue: undefined,
        timestampFilterValue: undefined
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
    </SearchContainer>
  )
}
