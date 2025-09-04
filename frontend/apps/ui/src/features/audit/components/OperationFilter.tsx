import {MultiSelect, Paper} from "@mantine/core"
import {TFunction} from "i18next"
import {AuditOperation} from "../types"

interface Args {
  operations?: AuditOperation[]
  onChange?: (value: string[]) => void
  t?: TFunction
}

export default function OperationFilter({operations, onChange, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <MultiSelect
        label={t?.("auditLog.operationFilter.label") || "Operation"}
        placeholder={t?.("auditLog.operationFilter.pickValue") || "Pick value"}
        clearable
        onChange={onChange}
        value={operations}
        data={["INSERT", "DELETE", "UPDATE", "TRUNCATE"]}
      />
    </Paper>
  )
}
