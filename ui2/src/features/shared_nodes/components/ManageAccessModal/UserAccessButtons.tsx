import {ActionIcon, Group, TextInput} from "@mantine/core"
import {IconMasksTheater, IconTrash} from "@tabler/icons-react"

interface Args {
  selectedIDs: string[]
}

export default function UserAccessButtons({selectedIDs}: Args) {
  if (selectedIDs.length == 0) {
    return (
      <Group justify="end">
        <TextInput />
      </Group>
    )
  }

  if (selectedIDs.length == 1) {
    return (
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="default" size={"lg"}>
            <IconMasksTheater />
          </ActionIcon>

          <ActionIcon color={"red"} size={"lg"}>
            <IconTrash />
          </ActionIcon>
        </Group>
        <Group>
          <TextInput />
        </Group>
      </Group>
    )
  }

  if (selectedIDs.length > 1) {
    return (
      <Group>
        <ActionIcon color={"red"} size={"lg"}>
          <IconTrash />
        </ActionIcon>
      </Group>
    )
  }

  return <></>
}
