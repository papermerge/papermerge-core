import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogVisibleColumnsUpdated,
  selectAuditLogVisibleColumns
} from "@/features/audit/storage/audit"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {AuditLogItem} from "../types"
import auditLogColumns from "./auditLogColumns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s =>
    selectAuditLogVisibleColumns(s, mode)
  )
  const allColumns = auditLogColumns(t).map(c => {
    if (!visibleColumns) {
      return {...c, visible: c.visible !== false}
    }
    if (visibleColumns.length == 0) {
      return {...c, visible: c.visible !== false}
    }

    if (visibleColumns?.includes(c.key)) {
      return {...c, visible: true}
    }

    return {...c, visible: false}
  })

  const onColumnChange = (columns: ColumnConfig<AuditLogItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(auditLogVisibleColumnsUpdated({mode, value: newVisibleColumns}))
  }

  return (
    <ColumnSelector
      t={t}
      i18NPrefix="auditLogColumns"
      columns={allColumns}
      onColumnsChange={onColumnChange}
    />
  )
}
