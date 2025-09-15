import {ActionIcon, Group, Text, Tooltip} from "@mantine/core"
import {useClipboard} from "@mantine/hooks"
import {IconCheck, IconCopy} from "@tabler/icons-react"
import {useCallback, useState} from "react"

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

export default function TruncatedTextWithCopy({
  value,
  maxLength = 8
}: {
  value: string
  maxLength?: number
}) {
  const clipboard = useClipboard({timeout: 1000})
  const [isHovered, setIsHovered] = useState(false)
  const truncatedValue = () => {
    if (!value) {
      return "-"
    }
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + "..."
    }

    return value
  }

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
      <Text size="xs" title={value}>
        {truncatedValue()}
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
