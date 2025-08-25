import {useAppSelector} from "@/app/hooks"
import type {FilterListConfig} from "@/features/audit/types"
import {selectAuditLogVisibleFilters} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useEffect, useState} from "react"

const FILTERS: FilterListConfig[] = [
  {key: "timestamp", label: "Timestamp", visible: false},
  {key: "operation", label: "Operation", visible: false},
  {key: "table_name", label: "Table", visible: false},
  {key: "user", label: "User", visible: false}
]

export default function useFilterList(): FilterListConfig[] {
  const mode = usePanelMode()
  const selectedFilterKeys = useAppSelector(s =>
    selectAuditLogVisibleFilters(s, mode)
  )
  const [filtersList, setFiltersList] = useState<FilterListConfig[]>(FILTERS)

  useEffect(() => {
    const newFilters = FILTERS.map(f => {
      const visible = selectedFilterKeys && selectedFilterKeys.includes(f.key)
      return {...f, visible}
    })

    setFiltersList(newFilters)
  }, [selectedFilterKeys])

  return filtersList
}
