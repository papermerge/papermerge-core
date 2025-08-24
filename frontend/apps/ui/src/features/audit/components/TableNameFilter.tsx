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
          "users_groups",
          "roles_permissions",
          "documents",
          "document_types_custom_fields",
          "nodes",
          "users"
        ]}
      />
    </Paper>
  )
}
