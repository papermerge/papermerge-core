import {useDisclosure} from "@mantine/hooks"
import {Button, Center, Stack, Table, Checkbox} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectAllGroups} from "@/slices/groups"
import axios from "axios"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import GroupModal from "./GroupModal"
import GroupRow from "./GroupRow"

export default function Groups() {
  const [opened, handlers] = useDisclosure(false)
  const groups = useSelector(selectAllGroups)

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

  if (groups.length == 0) {
    return (
      <div>
        <EmptyGroups onClick={handlers.open} />
        <GroupModal
          opened={opened}
          onSubmit={onSubmit}
          onClose={handlers.close}
        />
      </div>
    )
  }

  const groupRows = groups.map(g => <GroupRow group={g} />)

  return (
    <div>
      <Button onClick={handlers.open}>New</Button>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox />
            </Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{groupRows}</Table.Tbody>
      </Table>
      <GroupModal
        opened={opened}
        onSubmit={onSubmit}
        onClose={handlers.close}
      />
    </div>
  )
}

type Args = {
  onClick: () => void
}

function EmptyGroups({onClick}: Args) {
  return (
    <Center>
      <Stack align="center">
        <div>Current there are no groups</div>

        <div>
          <Button onClick={() => onClick()}>Create Group</Button>
        </div>
      </Stack>
    </Center>
  )
}
