import {ActionIcon, Badge, Group, Text, Tooltip} from "@mantine/core"
import {useClipboard} from "@mantine/hooks"
import {
  IconCheck,
  IconColumns2,
  IconCopy,
  IconDatabase,
  IconUser
} from "@tabler/icons-react"
import type {ColumnConfig} from "kommon"
import {useState} from "react"
import type {AuditLogItem} from "../types"

// Helper component for truncated text with copy functionality
const TruncatedTextWithCopy = ({
  value,
  maxLength = 8
}: {
  value: string
  maxLength?: number
}) => {
  const clipboard = useClipboard({timeout: 2000})
  const [isHovered, setIsHovered] = useState(false)
  const truncatedValue = value.substring(0, maxLength) + "..."

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Text size="xs" ff="monospace" title={value}>
        {truncatedValue}
      </Text>
      <Tooltip label={clipboard.copied ? "Copied!" : "Copy"}>
        <ActionIcon
          size="xs"
          variant="subtle"
          color={clipboard.copied ? "green" : "gray"}
          onClick={() => clipboard.copy(value)}
          style={{
            opacity: isHovered || clipboard.copied ? 1 : 0,
            transition: "opacity 0.2s ease"
          }}
        >
          {clipboard.copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

type ClickableFunc<T> = (row: T, details: boolean) => void

interface ClickableProps<T> {
  onClickHandler?: ClickableFunc<T>
  row: T
  children: React.ReactNode
}

const Clickable = <T,>({onClickHandler, row, children}: ClickableProps<T>) => {
  return (
    <Group gap="xs">
      <IconColumns2
        size={14}
        style={{
          opacity: 0,
          cursor: "pointer"
        }}
        onClick={() => onClickHandler?.(row, true)}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = "0.6"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = "0"
        }}
      />
      <div
        style={{cursor: "pointer"}}
        onClick={() => onClickHandler?.(row, false)}
      >
        {children}
      </div>
    </Group>
  )
}

const auditLogColumns: ColumnConfig<AuditLogItem>[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    sortable: true,
    filterable: false,
    width: 180,
    minWidth: 180,
    render: (value, row, onClick) => {
      const date = new Date(value as string)

      return (
        <Clickable row={row} onClickHandler={onClick}>
          <Text component="a" size="xs">
            {date.toLocaleDateString()}
          </Text>
          <Text size="xs" c="dimmed">
            {date.toLocaleTimeString()}
          </Text>
        </Clickable>
      )
    }
  },
  {
    key: "operation",
    label: "Operation",
    sortable: true,
    filterable: true,
    width: 100,
    minWidth: 120,
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
    width: 120,
    minWidth: 120,
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
    minWidth: 100,
    render: value => <TruncatedTextWithCopy value={value as string} />
  },
  {
    key: "username",
    label: "User",
    sortable: true,
    filterable: true,
    width: 120,
    minWidth: 100,
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
    minWidth: 100,
    render: value => <TruncatedTextWithCopy value={value as string} />
  },
  {
    key: "id",
    label: "Log ID",
    sortable: false,
    filterable: false,
    visible: false, // Hidden by default
    width: 200,
    minWidth: 100,
    render: value => <TruncatedTextWithCopy value={value as string} />
  }
]

export default auditLogColumns
