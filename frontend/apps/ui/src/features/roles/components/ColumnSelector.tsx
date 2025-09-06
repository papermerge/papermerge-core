import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  roleListVisibleColumnsUpdated,
  selectRoleVisibleColumns
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {RoleItem} from "../types"
import roleColumns from "./roleColumns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s => selectRoleVisibleColumns(s, mode))
  const allColumns = roleColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<RoleItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(roleListVisibleColumnsUpdated({mode, value: newVisibleColumns}))
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="roleColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
