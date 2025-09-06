import {useAppSelector} from "@/app/hooks"
import {selectRoleVisibleColumns} from "@/features/roles/storage/role"
import {usePanelMode} from "@/hooks"
import {ColumnConfig} from "kommon"

export default function useVisibleColumns<T>(
  columns: ColumnConfig<T>[]
): ColumnConfig<T>[] {
  const mode = usePanelMode()
  const selected = useAppSelector(s => selectRoleVisibleColumns(s, mode))
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
