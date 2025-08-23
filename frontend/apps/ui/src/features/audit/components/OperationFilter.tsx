import {MultiSelect, Paper} from "@mantine/core"

export default function OperationFilter() {
  return (
    <Paper p="xs">
      <MultiSelect
        label="Operation"
        placeholder="Pick value"
        clearable
        data={["INSERT", "DELETE", "UPDATE", "TRUNCATE"]}
      />
    </Paper>
  )
}
