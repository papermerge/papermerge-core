import {useAppSelector} from "@/app/hooks"
import {selectDocumentsByCategoryVisibleColumns} from "@/features/documents-by-category/storage/documentsByCategory"
import {usePanelMode} from "@/hooks"
import {ColumnConfig} from "kommon"

export default function useVisibleColumns<T>(
  columns: ColumnConfig<T>[]
): ColumnConfig<T>[] {
  const mode = usePanelMode()
  const selected = useAppSelector(s =>
    selectDocumentsByCategoryVisibleColumns(s, mode)
  )
  const hasSelection = selected && selected.length > 0

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
