import {Text} from "@mantine/core"
import {IconFilter} from "@tabler/icons-react"

interface Args {
  tokensCount: number
  isHovering: boolean
}

export default function SearchCompactSummary({tokensCount, isHovering}: Args) {
  return (
    <Text
      size="sm"
      c="dimmed"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "all 0.2s ease",
        color: isHovering ? "#1971c2" : undefined // Darker blue on hover
      }}
    >
      <IconFilter size={16} color={isHovering ? "#1971c2" : "#228be6"} />
      <span
        style={{
          fontWeight: 500,
          color: isHovering ? "#1971c2" : "#228be6"
        }}
      >
        {tokensCount} active {tokensCount === 1 ? "filter" : "filters"}
      </span>
    </Text>
  )
}
