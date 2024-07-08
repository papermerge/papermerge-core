import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"

export default function DeleteButton() {
  const onClick = () => {}

  return (
    <Tooltip withArrow label="Delete">
      <ActionIcon size="lg" onClick={onClick} variant={"default"}>
        <IconTrash />
      </ActionIcon>
    </Tooltip>
  )
}
