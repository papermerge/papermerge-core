import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelVisibleColumns} from "@/features/ui/panelRegistry"
import {ColumnConfig} from "kommon"

export default function useVisibleColumns<T>(
  columns: ColumnConfig<T>[]
): ColumnConfig<T>[] {
  const {panelId} = usePanel()
  const selected = useAppSelector(s => selectPanelVisibleColumns(s, panelId))
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
