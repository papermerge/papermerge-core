import {Text} from "@mantine/core"
import {IconCheck} from "@tabler/icons-react"

export default function SuccessMessage({
  children
}: {
  children: React.ReactNode
}) {
  if (!children) return null

  return (
    <Text
      c="green"
      size="sm"
      mt="md"
      ta="center"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px"
      }}
    >
      <IconCheck size={16} />
      {children}
    </Text>
  )
}
