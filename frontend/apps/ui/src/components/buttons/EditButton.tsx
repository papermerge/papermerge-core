import {Button, ButtonProps} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

interface Args extends ButtonProps {
  text: string
  onClick?: () => void
}

export default function EditButton({text, onClick, ...buttonProps}: Args) {
  return (
    <Button
      leftSection={<IconEdit />}
      onClick={onClick}
      color={"teal"}
      variant="filled"
      {...buttonProps}
    >
      {text}
    </Button>
  )
}
