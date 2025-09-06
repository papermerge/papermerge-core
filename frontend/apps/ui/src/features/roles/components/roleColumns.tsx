import {ActionIcon, Group, Text, Tooltip} from "@mantine/core"
import {useClipboard} from "@mantine/hooks"
import {IconCheck, IconColumns2, IconCopy} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"
import {useCallback, useState} from "react"
import type {ByUser, RoleItem} from "../types"

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

export default function roleColumns(t?: TFunction) {
  const columns: ColumnConfig<RoleItem>[] = [
    {
      key: "name",
      label: t?.("roleColumns.name") || "Name",
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "id",
      label: t?.("roleColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "created_at",
      label: t?.("roleColumns.created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "created_by",
      label: t?.("roleColumns.created_by") || "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    },
    {
      key: "updated_at",
      label: t?.("roleColumns.updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "updated_by",
      label: t?.("roleColumns.updated_by") || "updated By",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    }
  ]
  return columns
}
