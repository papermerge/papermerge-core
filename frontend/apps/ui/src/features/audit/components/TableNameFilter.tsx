import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTableNameFilterValueUpdated,
  selectAuditLogTableNameFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {MultiSelect, Paper} from "@mantine/core"
import React, {useCallback, useEffect, useMemo} from "react"
import type {AuditLogQueryParams, FilterHookReturn} from "../types"

interface Args {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

// Move static data outside component to prevent recreation
const ALL_TABLES = [
  "nodes",
  "document_versions",
  "custom_fields",
  "document_types",
  "shared_nodes",
  "tags",
  "users",
  "groups",
  "users_roles",
  "users_groups",
  "roles_permissions",
  "nodes_tags",
  "document_types_custom_fields"
] as const

export function useTableNameFilter({setQueryParams}: Args): FilterHookReturn {
  const mode = usePanelMode()
  const table_names = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )

  // Memoize the clear function to prevent unnecessary re-renders
  const clear = useCallback(() => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: undefined
    }))
  }, [setQueryParams])

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: table_names?.join(",")
    }))
  }, [setQueryParams, table_names]) // Add dependencies

  return {clear}
}

// Memoize the main component
const TableNameFilter = React.memo(function TableNameFilter({
  setQueryParams
}: Args) {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const table_names = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )

  // Memoize the onChange handler
  const onChange = useCallback(
    (values: string[]) => {
      const joinedValues = values.join(",")

      setQueryParams(prev => ({
        ...prev,
        filter_table_name: joinedValues
      }))

      dispatch(
        auditLogTableNameFilterValueUpdated({
          mode,
          value: values
        })
      )
    },
    [setQueryParams, dispatch, mode]
  )

  // Memoize Paper wrapper props if they're complex (optional here)
  const paperProps = useMemo(() => ({p: "xs" as const}), [])

  return (
    <Paper {...paperProps}>
      <MultiSelect
        searchable
        label="Table"
        placeholder="Pick value"
        clearable
        onChange={onChange}
        value={table_names}
        data={ALL_TABLES}
      />
    </Paper>
  )
})

export default TableNameFilter
