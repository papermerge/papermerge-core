import {useAppSelector} from "@/app/hooks"
import type {FilterListConfig} from "@/features/audit/types"
import {selectAuditLogVisibleFilters} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useEffect, useState} from "react"

let allFiltersConfig = [
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
  const [filtersList, setFiltersList] = useState<FilterListConfig[]>([])

  useEffect(() => {
    let newFilters: FilterListConfig[] = []
    allFiltersConfig.forEach(f => {
      if (selectedFilterKeys && selectedFilterKeys?.includes(f.key)) {
        newFilters.push({...f, visible: true})
      }
    })

    setFiltersList(newFilters)
  }, [selectedFilterKeys])

  return filtersList
}
