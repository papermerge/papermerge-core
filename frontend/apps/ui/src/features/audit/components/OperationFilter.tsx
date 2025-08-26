import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {
  AuditLogQueryParams,
  AuditOperation,
  FilterHookReturn
} from "@/features/audit/types"
import {
  auditLogOperationFilterValueUpdated,
  selectAuditLogOperationFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {MultiSelect, Paper} from "@mantine/core"
import React, {useEffect} from "react"

interface Args {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

export function useOperationFilter({setQueryParams}: Args): FilterHookReturn {
  const mode = usePanelMode()
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )

  const clear = () => {
    setQueryParams(prev => ({
      ...prev,
      filter_operation: undefined
    }))
  }

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      filter_operation: operations?.join(",")
    }))
  }, [])

  return {clear}
}

export default function OperationFilter({setQueryParams}: Args) {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      filter_operation: operations?.join(",")
    }))
  }, [operations])

  const onChange = (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      filter_operation: values.join(",")
    }))
    dispatch(
      auditLogOperationFilterValueUpdated({
        mode,
        value: values as Array<AuditOperation>
      })
    )
  }

  return (
    <Paper p="xs">
      <MultiSelect
        label="Operation"
        placeholder="Pick value"
        clearable
        onChange={onChange}
        value={operations}
        data={["INSERT", "DELETE", "UPDATE", "TRUNCATE"]}
      />
    </Paper>
  )
}
