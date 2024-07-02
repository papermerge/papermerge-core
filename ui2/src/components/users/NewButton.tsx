import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

export default function NewButton() {
  const onClick = () => {}
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
