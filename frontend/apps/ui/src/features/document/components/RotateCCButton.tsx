import {ActionIcon, Tooltip} from "@mantine/core"
import {IconRotate} from "@tabler/icons-react"

interface Args {
  onClick: () => void
}

export default function RotateCCButton({onClick}: Args) {
  return (
    <Tooltip label="Rotate selected pages counter-clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
