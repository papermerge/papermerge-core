import {ActionIcon, Tooltip} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import {useState} from "react"

interface Args {
  onClick: () => void
  tooltip?: string
}

export default function ClearButton({onClick, tooltip = "Clear all"}: Args) {
  const [isHovering, setIsHovering] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering box focus
    onClick()
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
        <IconX
          size={16}
          style={{
            color: isHovering ? "#fa5252" : "#868e96", // Red on hover, gray default
            transition: "color 0.2s ease"
          }}
        />
      </ActionIcon>
    </Tooltip>
  )
}
