import {MultiSelect, Paper} from "@mantine/core"
import {AuditOperation} from "../types"

interface Args {
  operations?: AuditOperation[]
  onChange?: (value: string[]) => void
}

export default function OperationFilter({operations, onChange}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
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
