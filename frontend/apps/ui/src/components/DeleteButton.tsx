import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"

interface DeleteButtonProps {
  text: string
  onClick: () => void
}

export default function DeleteButton({text, onClick}: DeleteButtonProps) {
  return (
    <Button
      leftSection={<IconTrash />}
      onClick={onClick}
      color={"red"}
      variant="filled"
    >
      {text}
    </Button>
  )
}
