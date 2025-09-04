import {ActionIcon, Badge, Group, Text, Tooltip} from "@mantine/core"
import {useClipboard} from "@mantine/hooks"
import {IconCheck, IconColumns2, IconCopy} from "@tabler/icons-react"
import {TFunction} from "i18next"
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
