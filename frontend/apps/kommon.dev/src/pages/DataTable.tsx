import {Badge, Group, Text} from "@mantine/core"
import {IconClock, IconDatabase, IconUser} from "@tabler/icons-react"
import type {ColumnConfig, PaginatedResponse} from "kommon"

interface AuditLogItem {
  id: string
  table_name: string
  record_id: string
  operation: "INSERT" | "UPDATE" | "DELETE"
  timestamp: string
  user_id: string
  username: string
}

export default function DataTablePage() {
  return <></>
}

const sampleData: PaginatedResponse<AuditLogItem> = {
  page_size: 15,
  page_number: 1,
  num_pages: 3,
  items: [
    {
      id: "319483c6-91a7-4f0d-8b3a-827f6079d9e4",
      table_name: "nodes",
      record_id: "add7799c-a39d-4c16-bf92-2b19d4792ce5",
      operation: "INSERT",
      timestamp: "2025-08-20T06:35:10.535760Z",
      user_id: "49e78737-7c6e-410f-ae27-315b04bdec69",
      username: "admin"
    },
    {
      id: "ef31f5c5-c141-40ca-8194-4671a7953ae5",
      table_name: "nodes",
      record_id: "add7799c-a39d-4c16-bf92-2b19d4792ce5",
      operation: "UPDATE",
      timestamp: "2025-08-20T06:40:08.056195Z",
      user_id: "49e78737-7c6e-410f-ae27-315b04bdec69",
      username: "admin"
    },
    {
      id: "e314b451-0347-46fd-8d70-b6e2d4709202",
      table_name: "nodes",
      record_id: "add7799c-a39d-4c16-bf92-2b19d4792ce5",
      operation: "DELETE",
      timestamp: "2025-08-21T03:55:49.877671Z",
      user_id: "49e78737-7c6e-410f-ae27-315b04bdec69",
      username: "admin"
    }
  ]
}

const auditLogColumns: ColumnConfig<AuditLogItem>[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    sortable: true,
    filterable: false,
    width: 180,
    render: value => {
      const date = new Date(value as string)
      return (
        <Group gap="xs">
          <IconClock size={14} style={{opacity: 0.6}} />
          <div>
            <Text size="xs">{date.toLocaleDateString()}</Text>
            <Text size="xs" c="dimmed">
              {date.toLocaleTimeString()}
            </Text>
          </div>
        </Group>
      )
    }
  },
  {
    key: "operation",
    label: "Operation",
    sortable: true,
    filterable: true,
    width: 100,
    render: value => {
      const colors: Record<string, string> = {
        INSERT: "green",
        UPDATE: "blue",
        DELETE: "red"
      }
      return (
        <Badge
          color={colors[value as string] || "gray"}
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
    label: "Table",
    sortable: true,
    filterable: true,
    width: 150,
    render: value => (
      <Group gap="xs">
        <IconDatabase size={14} style={{opacity: 0.6}} />
        <Text size="sm" ff="monospace">
          {value as string}
        </Text>
      </Group>
    )
  },
  {
    key: "record_id",
    label: "Record ID",
    sortable: false,
    filterable: true,
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  },
  {
    key: "username",
    label: "User",
    sortable: true,
    filterable: true,
    width: 120,
    render: value => (
      <Group gap="xs">
        <IconUser size={14} style={{opacity: 0.6}} />
        <Text size="sm">{value as string}</Text>
      </Group>
    )
  },
  {
    key: "user_id",
    label: "User ID",
    sortable: false,
    filterable: true,
    visible: false, // Hidden by default
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  },
  {
    key: "id",
    label: "Log ID",
    sortable: false,
    filterable: false,
    visible: false, // Hidden by default
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  }
]
