import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectAllGroups} from "@/slices/groups"
import GroupRow from "./GroupRow"
import ActionButtons from "./ActionButtons"

export default function Groups() {
  const groups = useSelector(selectAllGroups)

  if (groups.length == 0) {
    return (
      <div>
        <ActionButtons />
        <Empty />
      </div>
    )
  }

  const groupRows = groups.map(g => <GroupRow key={g.id} group={g} />)

  return (
    <div>
      <ActionButtons />
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
    </div>
  )
}

function Empty() {
  return (
    <Center>
      <Stack align="center">
        <div>Currently there are no groups</div>
      </Stack>
    </Center>
  )
}
