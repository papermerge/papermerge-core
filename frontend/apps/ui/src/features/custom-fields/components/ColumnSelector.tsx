import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  customFieldListVisibleColumnsUpdated,
  selectCustomFieldVisibleColumns
} from "@/features/custom-fields/storage/custom_field"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {CustomFieldItem} from "../types"
import customFieldColumns from "./columns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s =>
    selectCustomFieldVisibleColumns(s, mode)
  )
  const allColumns = customFieldColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<CustomFieldItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(
      customFieldListVisibleColumnsUpdated({mode, value: newVisibleColumns})
    )
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="customFieldColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
