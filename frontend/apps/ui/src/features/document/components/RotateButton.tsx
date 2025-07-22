import {ActionIcon, Tooltip} from "@mantine/core"
import {IconRotateClockwise} from "@tabler/icons-react"

interface Args {
  onClick: () => void
}

export default function RotateButton({onClick}: Args) {
  return (
    <Tooltip label="Rotate selected pages clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotateClockwise stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
