import {MultiSelect, Paper} from "@mantine/core"

export default function TableNameFilter() {
  return (
    <Paper p="xs">
      <MultiSelect
        searchable
        label="Table"
        placeholder="Pick value"
        clearable
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
