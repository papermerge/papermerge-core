import {Text} from "@mantine/core"
import {IconAlertCircle} from "@tabler/icons-react"

export default function ErrorMessage({children}: {children: React.ReactNode}) {
  if (!children) return null

  return (
    <Text
      c="red"
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
      <IconAlertCircle size={16} />
      {children}
    </Text>
  )
}
