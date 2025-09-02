import {useAppSelector} from "@/app/hooks"
import {selectAuditLogVisibleColumns} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {ColumnConfig} from "kommon"

export default function useVisibleColumns<T>(
  columns: ColumnConfig<T>[]
): ColumnConfig<T>[] {
  const mode = usePanelMode()
  const selected = useAppSelector(s => selectAuditLogVisibleColumns(s, mode))
  const visibleColumns = columns
    .filter(c => {
      if (!selected) {
        console.log("selected is empty")
        return Boolean(c.visible !== false)
      }
      if (selected.length == 0) {
        console.log("selected is empty")
        return Boolean(c.visible !== false)
      }
      console.log(`selected IS NOT EMPTY ${selected}`)
      return selected.includes(String(c.key))
    })
    .map(c => {
      return {...c, visible: true}
    })

  console.log(visibleColumns)
  return visibleColumns
}
