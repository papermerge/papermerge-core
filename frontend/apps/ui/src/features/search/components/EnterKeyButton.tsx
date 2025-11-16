import {ActionIcon} from "@mantine/core"

import {IconCornerDownLeft} from "@tabler/icons-react"

interface Args {
  onClick: () => void
}

export default function EnterKeyButton({onClick}: Args) {
  return (
    <ActionIcon onClick={onClick} variant="default">
      <IconCornerDownLeft size={16} />
    </ActionIcon>
  )
}
