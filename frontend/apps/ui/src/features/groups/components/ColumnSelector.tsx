import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  groupListVisibleColumnsUpdated,
  selectGroupVisibleColumns
} from "@/features/groups/storage/group"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {GroupItem} from "../types"
import groupColumns from "./columns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s => selectGroupVisibleColumns(s, mode))
  const allColumns = groupColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<GroupItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(groupListVisibleColumnsUpdated({mode, value: newVisibleColumns}))
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="groupColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
