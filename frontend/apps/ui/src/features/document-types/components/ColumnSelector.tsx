import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  documentTypeListVisibleColumnsUpdated,
  selectDocumentTypeVisibleColumns
} from "@/features/document-types/storage/documentType"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {DocumentTypeItem} from "../types"
import documentTypeColumns from "./columns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s =>
    selectDocumentTypeVisibleColumns(s, mode)
  )
  const allColumns = documentTypeColumns(t).map(c => {
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

  const onColumnChange = (columns: ColumnConfig<DocumentTypeItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(
      documentTypeListVisibleColumnsUpdated({mode, value: newVisibleColumns})
    )
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="documentTypeColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
