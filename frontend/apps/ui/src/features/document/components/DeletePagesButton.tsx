import {ActionIcon, Tooltip} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"

interface Args {
  onClick: () => void
}

export default function DeleteButton({onClick}: Args) {
  return (
    <>
      <Tooltip withArrow label="Delete">
        <ActionIcon size="lg" onClick={onClick} color={"red"}>
          <IconTrash />
        </ActionIcon>
      </Tooltip>
    </>
  )
}
