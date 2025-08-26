import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTableNameFilterValueUpdated,
  selectAuditLogTableNameFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {MultiSelect, Paper} from "@mantine/core"
import React, {useEffect} from "react"
import type {AuditLogQueryParams, FilterHookReturn} from "../types"

interface Args {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

export function useTableNameFilter({setQueryParams}: Args): FilterHookReturn {
  const mode = usePanelMode()
  const table_names = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )

  const clear = () => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: undefined
    }))
  }

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: table_names?.join(",")
    }))
  }, [])

  return {clear}
}

export default function TableNameFilter({setQueryParams}: Args) {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const table_names = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )

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
  ]

  const onChange = (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: values.join(",")
    }))
    dispatch(
      auditLogTableNameFilterValueUpdated({
        mode,
        value: values
      })
    )
  }

  return (
    <Paper p="xs">
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
}
