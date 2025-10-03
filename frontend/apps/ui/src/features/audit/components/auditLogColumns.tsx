import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import {Badge, Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"
import type {AuditLogItem} from "../types"

const OPERATION_COLORS = {
  INSERT: "green",
  UPDATE: "blue",
  DELETE: "red"
} as const

export default function auditLogColumns(t?: TFunction) {
  const columns: ColumnConfig<AuditLogItem>[] = [
    {
      key: "timestamp",
      label: t?.("auditLogColumns.timestamp") || "Timestamp",
      sortable: true,
      filterable: false,
      width: 180,
      minWidth: 180,
      render: (value, row, onClick) => {
        return (
          <Box
            style={{cursor: "pointer"}}
            onClick={() => onClick?.(row, false)}
          >
            <TimestampZ value={value as string} />
          </Box>
        )
      }
    },
    {
      key: "operation",
      label: t?.("auditLogColumns.operation") || "Operation",
      sortable: true,
      filterable: true,
      width: 100,
      minWidth: 120,
      render: value => {
        const operation = value as keyof typeof OPERATION_COLORS
        return (
          <Badge
            color={OPERATION_COLORS[operation] || "gray"}
            variant="light"
            size="sm"
          >
            {value as string}
          </Badge>
        )
      }
    },
    {
      key: "table_name",
      label: t?.("auditLogColumns.table_name") || "Table",
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 120,
      render: value => (
        <Text size="sm" ff="monospace">
          {value as string}
        </Text>
      )
    },
    {
      key: "record_id",
      label: t?.("auditLogColumns.record_id") || "Record ID",
      sortable: false,
      filterable: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "username",
      label: t?.("auditLogColumns.username") || "User",
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "user_id",
      label: t?.("auditLogColumns.user_id") || "User ID",
      sortable: false,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "id",
      label: t?.("auditLogColumns.id") || "Log ID",
      sortable: false,
      filterable: false,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    }
  ]
  return columns
}
