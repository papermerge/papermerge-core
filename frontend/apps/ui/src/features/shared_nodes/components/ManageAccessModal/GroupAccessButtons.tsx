import {ActionIcon, Group, TextInput} from "@mantine/core"
import {IconMasksTheater, IconTrash} from "@tabler/icons-react"
import type {IDType} from "./type"

interface Args {
  selectedIDs: string[]
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_ids: string[], idType: IDType) => void
}

export default function GroupAccessButtons({
  selectedIDs,
  onClickDeleteButton,
  onClickViewButton
}: Args) {
  const onLocalClickViewButton = () => {
    onClickViewButton(selectedIDs[0], "group")
  }

  const onLocalClickDeleteButton = () => {
    onClickDeleteButton(selectedIDs, "group")
  }

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
          <ActionIcon
            variant="default"
            size={"lg"}
            onClick={onLocalClickViewButton}
          >
            <IconMasksTheater />
          </ActionIcon>

          <ActionIcon
            color={"red"}
            size={"lg"}
            onClick={onLocalClickDeleteButton}
          >
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
        <ActionIcon
          color={"red"}
          size={"lg"}
          onClick={onLocalClickDeleteButton}
        >
          <IconTrash />
        </ActionIcon>
      </Group>
    )
  }

  return <></>
}
