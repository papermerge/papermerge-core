import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelVisibleColumns,
  setPanelList
} from "@/features/ui/panelRegistry"
import {NodeType} from "@/types"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import nodeColumns from "./columns"

export default function ColumnSelectorContainer() {
  const {panelId} = usePanel()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s =>
    selectPanelVisibleColumns(s, panelId)
  )
  const allColumns = nodeColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<NodeType>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(
      setPanelList({
        panelId,
        list: {visibleColumns: newVisibleColumns}
      })
    )
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="tagColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
