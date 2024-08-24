import {Tooltip, ActionIcon} from "@mantine/core"
import {IconRotateClockwise} from "@tabler/icons-react"

export default function RotateCCButton() {
  const onClick = () => {}

  return (
    <Tooltip label="Rotate selected pages clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotateClockwise stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
