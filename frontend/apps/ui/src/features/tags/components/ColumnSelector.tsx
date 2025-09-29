import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectTagVisibleColumns,
  tagListVisibleColumnsUpdated
} from "@/features/tags/storage/tag"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {TagItem} from "../types"
import tagColumns from "./columns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s => selectTagVisibleColumns(s, mode))
  const allColumns = tagColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<TagItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(tagListVisibleColumnsUpdated({mode, value: newVisibleColumns}))
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
