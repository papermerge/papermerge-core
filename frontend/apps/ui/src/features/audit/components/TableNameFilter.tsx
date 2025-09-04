import {MultiSelect, Paper} from "@mantine/core"
import {TFunction} from "i18next"

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
] as const

interface Args {
  tableNames?: string[]
  onChange?: (value: string[]) => void
  t?: TFunction
}

export default function TableNameFilter({tableNames, onChange, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <MultiSelect
        searchable
        label={t?.("auditLog.tableNameFilter.label") || "Table"}
        placeholder={t?.("auditLog.tableNameFilter.pickValue") || "Pick value"}
        clearable
        onChange={onChange}
        value={tableNames}
        data={ALL_TABLES}
      />
    </Paper>
  )
}
