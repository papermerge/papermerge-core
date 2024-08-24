import {Tooltip, ActionIcon} from "@mantine/core"
import {IconRotate} from "@tabler/icons-react"

export default function RotateCCButton() {
  const onClick = () => {}

  return (
    <Tooltip label="Rotate selected pages counter-clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
