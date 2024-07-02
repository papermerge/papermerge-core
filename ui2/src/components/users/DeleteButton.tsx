import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"

export default function DeleteButton() {
  const onClick = () => {}
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}
