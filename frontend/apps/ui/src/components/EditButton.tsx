import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

interface EditButtonProps {
  text: string
  onClick: () => void
}

export default function EditButton({text, onClick}: EditButtonProps) {
  return (
    <Button
      leftSection={<IconEdit />}
      onClick={onClick}
      color={"teal"}
      variant="filled"
    >
      {text}
    </Button>
  )
}
