import {useSelector} from "react-redux"
import {useDisclosure} from "@mantine/hooks"
import {Button, Center, Group, Table, Checkbox} from "@mantine/core"
import axios from "axios"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import {selectSelectedIds} from "@/slices/groups"
import GroupModal from "./GroupModal"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)
  const [opened, handlers] = useDisclosure(false)
  const onSubmit = async (name: string, scopes: string[]) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    const response = await axios.post(
      `${rest_api_url}/api/groups/`,
      {name, scopes},
      {
        headers: defaultHeaders
      }
    )
    if (response.status == 201) {
      handlers.close()
    }
  }

  return (
    <Group>
      <NewButton onClick={handlers.open} />
      {selectedIds.length == 1 ? <EditButton /> : ""}
      {selectedIds.length > 1 ? <DeleteButton /> : ""}
      <GroupModal
        opened={opened}
        onSubmit={onSubmit}
        onClose={handlers.close}
      />
    </Group>
  )
}

type NewButtonArgs = {
  onClick: () => void
}

function NewButton({onClick}: NewButtonArgs) {
  return <Button onClick={onClick}>New</Button>
}

function EditButton() {
  return <Button>Edit</Button>
}

function DeleteButton() {
  return <Button color="red">Delete</Button>
}
