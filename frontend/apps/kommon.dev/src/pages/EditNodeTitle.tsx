import {Button, Checkbox, Group, Stack} from "@mantine/core"
import {EditNodeTitleModal} from "kommon"
import {useState} from "react"

export default function EditNodeTitleContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)

  return (
    <Stack>
      <Group>
        <Button onClick={() => setOpened(!opened)}>Toggle</Button>
        <Checkbox
          label="Is Loading"
          onClick={() => setInProgress(!inProgress)}
        />
      </Group>
      <EditNodeTitleModal
        inProgress={inProgress}
        onCancel={() => setOpened(false)}
        value={"letter.pdf"}
        opened={opened}
      />
    </Stack>
  )
}
