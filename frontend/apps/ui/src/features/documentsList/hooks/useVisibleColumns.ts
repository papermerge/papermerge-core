import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"

import documentByCategoryColumns from "@/features/documentsList/components/columns"
import flatColumns from "@/features/documentsList/components/flatColumns"
import {DocumentListItem} from "../types"

import type {
  SearchDocumentsByCategoryResponse,
  SearchDocumentsResponse
} from "@/features/documentsList/storage/api"
import {selectPanelVisibleColumns} from "@/features/ui/panelRegistry"
import {ColumnConfig} from "kommon"
import {useTranslation} from "react-i18next"

export default function useVisibleColumns(
  data?: SearchDocumentsResponse | SearchDocumentsByCategoryResponse
): ColumnConfig<DocumentListItem>[] {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const selected = useAppSelector(s => selectPanelVisibleColumns(s, panelId))

  const hasSelection = selected && selected.length > 0
  let columns: ColumnConfig<DocumentListItem>[] = []

  if (data?.items) {
    // different set of columns depending on category ID
    columns = documentByCategoryColumns({items: data?.items, t})
  } else {
    // basic columns common for all categories i.e. id, title, tags, category etc
    columns = flatColumns(t)
  }

  const visibleColumns = columns
    .filter(c => {
      if (hasSelection) {
        return selected.includes(String(c.key))
      }

      return Boolean(c.visible !== false)
    })
    .map(c => {
      return {...c, visible: true}
    })

  return visibleColumns
}
