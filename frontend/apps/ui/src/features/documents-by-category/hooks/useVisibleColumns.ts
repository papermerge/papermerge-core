import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"

import documentByCategoryColumns from "@/features/documents-by-category/components/columns"
import flatColumns from "@/features/documents-by-category/components/flatColumns"
import {DocumentByCategoryItem} from "../types"
import {selectDocumentCategoryID} from "../storage/documentsByCategory"
import useDocumentsByCategoryTable from "@/features/documents-by-category/hooks/useDocumentsByCategoryTable"

import {selectPanelVisibleColumns} from "@/features/ui/panelRegistry"
import {ColumnConfig} from "kommon"
import {useTranslation} from "react-i18next"

export default function useVisibleColumns(): ColumnConfig<DocumentByCategoryItem>[] {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const categoryID = useAppSelector(selectDocumentCategoryID)
  const selected = useAppSelector(s => selectPanelVisibleColumns(s, panelId))
  const {data} = useDocumentsByCategoryTable()

  const hasSelection = selected && selected.length > 0
  let columns: ColumnConfig<DocumentByCategoryItem>[] = []

  console.log(categoryID)
  if (categoryID) {
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
