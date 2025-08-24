import {MultiSelect, Paper} from "@mantine/core"
import React from "react"
import type {AuditLogQueryParams} from "../types"

interface Args {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

export default function OperationFilter({setQueryParams}: Args) {
  const onChange = (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      filter_operation: values.join(",")
    }))
  }

  return (
    <Paper p="xs">
      <MultiSelect
        label="Operation"
        placeholder="Pick value"
        clearable
        onChange={onChange}
        data={["INSERT", "DELETE", "UPDATE", "TRUNCATE"]}
      />
    </Paper>
  )
}
