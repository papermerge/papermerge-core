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
import {useCallback, useState} from "react"
import type {AuditLogItem} from "../types"

const STATIC_STYLES = {
  clickableIcon: {opacity: 0, cursor: "pointer"},
  clickableDiv: {cursor: "pointer"},
  dbIcon: {opacity: 0.6},
  userIcon: {opacity: 0.6},
  copyIcon: (isVisible: boolean, copied: boolean) => ({
    opacity: isVisible || copied ? 1 : 0,
    transition: "opacity 0.1s ease" // Reduced from 0.2s
  })
} as const

const OPERATION_COLORS = {
  INSERT: "green",
  UPDATE: "blue",
  DELETE: "red"
} as const

// Only use complex component when user actually hovers/interacts
const TruncatedTextWithCopy = ({
  value,
  maxLength = 8
}: {
  value: string
  maxLength?: number
}) => {
  const clipboard = useClipboard({timeout: 1000}) // Reduced timeout
  const [isHovered, setIsHovered] = useState(false)
  const truncatedValue = value.substring(0, maxLength) + "..."

  // Memoize handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  const handleCopy = useCallback(
    () => clipboard.copy(value),
    [clipboard, value]
  )

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Text size="xs" ff="monospace" title={value}>
        {truncatedValue}
      </Text>
      <Tooltip label={clipboard.copied ? "Copied!" : "Copy"}>
        <ActionIcon
          size="xs"
          variant="subtle"
          color={clipboard.copied ? "green" : "gray"}
          onClick={handleCopy}
          style={STATIC_STYLES.copyIcon(isHovered, clipboard.copied)}
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
  // Memoize handlers to prevent recreation
  const handleDetailsClick = useCallback(
    () => onClickHandler?.(row, true),
    [onClickHandler, row]
  )
  const handleMainClick = useCallback(
    () => onClickHandler?.(row, false),
    [onClickHandler, row]
  )

  const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.currentTarget.style.opacity = "0.6"
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.currentTarget.style.opacity = "0"
  }, [])

  return (
    <Group gap="xs">
      <IconColumns2
        size={14}
        style={STATIC_STYLES.clickableIcon}
        onClick={handleDetailsClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <div style={STATIC_STYLES.clickableDiv} onClick={handleMainClick}>
        {children}
      </div>
    </Group>
  )
}

// Pre-process date formatting to avoid repeated Date() calls
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  }
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
      const {date, time} = formatTimestamp(value as string)

      return (
        <Clickable row={row} onClickHandler={onClick}>
          <Text component="a" size="xs">
            {date}
          </Text>
          <Text size="xs" c="dimmed">
            {time}
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
    label: "Table",
    sortable: true,
    filterable: true,
    width: 120,
    minWidth: 120,
    render: value => (
      <Group gap="xs">
        <IconDatabase size={14} style={STATIC_STYLES.dbIcon} />
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
    // Use simple version first, upgrade to complex on demand
    render: value => {
      const str = value as string
      // For short values, just show them directly (faster)
      if (str.length <= 12) {
        return (
          <Text size="xs" ff="monospace">
            {str}
          </Text>
        )
      }
      // Only use complex component for long values
      return <TruncatedTextWithCopy value={str} />
    }
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
        <IconUser size={14} style={STATIC_STYLES.userIcon} />
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
    render: value => {
      const str = value as string
      if (str.length <= 12) {
        return (
          <Text size="xs" ff="monospace">
            {str}
          </Text>
        )
      }
      return <TruncatedTextWithCopy value={str} />
    }
  },
  {
    key: "id",
    label: "Log ID",
    sortable: false,
    filterable: false,
    visible: false, // Hidden by default
    width: 200,
    minWidth: 100,
    render: value => {
      const str = value as string
      if (str.length <= 12) {
        return (
          <Text size="xs" ff="monospace">
            {str}
          </Text>
        )
      }
      return <TruncatedTextWithCopy value={str} />
    }
  }
]

export default auditLogColumns
