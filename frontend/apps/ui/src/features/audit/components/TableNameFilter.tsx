import {MultiSelect, Paper} from "@mantine/core"
import React from "react"
import type {AuditLogQueryParams} from "../types"

interface Args {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

export default function TableNameFilter({setQueryParams}: Args) {
  const onChange = (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      filter_table_name: values.join(",")
    }))
  }

  return (
    <Paper p="xs">
      <MultiSelect
        searchable
        label="Table"
        placeholder="Pick value"
        clearable
        onChange={onChange}
        data={[
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
        ].sort()}
      />
    </Paper>
  )
}
