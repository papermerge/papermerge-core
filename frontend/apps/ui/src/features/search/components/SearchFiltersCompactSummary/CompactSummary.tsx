import {Text} from "@mantine/core"
import {IconFilter} from "@tabler/icons-react"

interface Args {
  tokensCount: number
}

export default function SearchCompactSummary({tokensCount}: Args) {
  return (
    <Text
      size="sm"
      c="dimmed"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "all 0.2s ease"
      }}
    >
      <IconFilter size={16} color={"#228be6"} />
      <span
        style={{
          fontWeight: 500,
          color: "#228be6"
        }}
      >
        {tokensCount} active {tokensCount === 1 ? "filter" : "filters"}
      </span>
    </Text>
  )
}
