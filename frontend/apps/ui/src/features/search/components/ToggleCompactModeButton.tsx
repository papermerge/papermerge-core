import {useState} from "react"

import {ActionIcon, Tooltip} from "@mantine/core"
import {IconArrowsMaximize, IconArrowsMinimize} from "@tabler/icons-react"

interface Args {
  onClick: () => void
  tooltip?: string
  isCompactMode?: boolean
}

export default function ToggleCompactModeButton({
  onClick,
  tooltip = "Show only summary",
  isCompactMode = false
}: Args) {
  const [isHovering, setIsHovering] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering box focus
    onClick()
  }

  const iconStyles = {
    color: isHovering ? "#00aeffff" : "#7ab6f2ff", // Red on hover, gray default
    transition: "color 0.2s ease"
  }

  return (
    <Tooltip label={tooltip} position="bottom" withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          flexShrink: 0, // Don't let button shrink
          transition: "color 0.2s ease",
          marginLeft: "auto"
        }}
      >
        {isCompactMode && <IconArrowsMaximize size={16} style={iconStyles} />}
        {!isCompactMode && <IconArrowsMinimize size={16} style={iconStyles} />}
      </ActionIcon>
    </Tooltip>
  )
}
