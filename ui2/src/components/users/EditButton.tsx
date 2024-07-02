import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

export default function EditButton() {
  const onClick = () => {}
  return (
    <Button leftSection={<IconEdit />} onClick={onClick} variant={"default"}>
      Edit
    </Button>
  )
}
