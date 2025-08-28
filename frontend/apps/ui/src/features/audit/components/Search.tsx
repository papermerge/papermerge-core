import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTableNameFilterValueCleared,
  auditLogTableNameFilterValueUpdated,
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
  const [localTableNames, setLocalTableNames] = useState<string[]>(
    tableNames || []
  )

  const onLocalTableNamesChange = (values: string[]) => {
    setLocalTableNames(values)
  }

  const onSearch = () => {
    dispatch(
      auditLogTableNameFilterValueUpdated({
        mode,
        value: localTableNames
      })
    )
  }

  const onClear = () => {
    setLocalTableNames([])

    dispatch(
      auditLogTableNameFilterValueCleared({
        mode
      })
    )
  }

  return (
    <SearchContainer onClear={onClear} onSearch={onSearch}>
      <TimestampFilter />
      <TableNameFilter
        tableNames={localTableNames}
        onChange={onLocalTableNamesChange}
      />
      <OperationFilter />
    </SearchContainer>
  )
}
