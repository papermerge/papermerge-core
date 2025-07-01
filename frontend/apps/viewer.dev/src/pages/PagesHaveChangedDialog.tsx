import {Checkbox, Divider, Group, Stack} from "@mantine/core"
import {useState} from "react"
import {PagesHaveChangedDialog} from "viewer"

export default function PagesHaveChangedDialogContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)

  const InProgressClicked = () => {
    setInProgress(!inProgress)
  }

  const OpenedClicked = () => {
    setOpened(!opened)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="In Progress" onClick={InProgressClicked} />
        <Checkbox label="Opened" onClick={OpenedClicked} />
      </Group>
      <Divider />
      <Group>
        <PagesHaveChangedDialog opened={opened} inProgress={inProgress} />
      </Group>
    </Stack>
  )
}
