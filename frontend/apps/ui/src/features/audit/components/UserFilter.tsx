import {MultiSelect, Paper} from "@mantine/core"

export default function UsersListFilter() {
  return (
    <Paper p="xs">
      <MultiSelect
        searchable
        label="User"
        placeholder="Pick value"
        clearable
        data={["admin", "eugen", "coco"]}
      />
    </Paper>
  )
}
