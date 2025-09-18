import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

interface NewButtonProps {
  text: string
  onClick: () => void
}

export default function NewButton({text, onClick}: NewButtonProps) {
  return (
    <Button
      leftSection={<IconPlus />}
      onClick={onClick}
      color={"teal"}
      variant="filled"
    >
      {text}
    </Button>
  )
}
