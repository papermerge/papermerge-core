import type {Group} from "@/types.d/shared_nodes"
import {SharedNodeAccessDetails} from "@/types.d/shared_nodes"
import {Center, Checkbox, Skeleton, Stack, Table} from "@mantine/core"
import GroupAccessButtons from "./GroupAccessButtons"
import GroupRow from "./GroupRow"
import type {IDType} from "./type"

interface Args {
  data?: SharedNodeAccessDetails
  selectedIDs: string[]
  onSelectionChange: (user_id: string, checked: boolean) => void
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_ids: string[], idType: IDType) => void
}

export default function ManageAccessGroups({
  data,
  selectedIDs,
  onSelectionChange,
  onClickDeleteButton,
  onClickViewButton
}: Args) {
  if (!data) {
    return <Skeleton my={"lg"} height={30}></Skeleton>
  }

  if (data.groups.length == 0) {
    return <Empty />
  }

  const onLocalSelectAll = () => {}

  const groupRows = Array.from(data.groups)
    .sort(sortPredicate)
    .map(u => (
      <GroupRow
        selectedIDs={selectedIDs}
        onChange={onSelectionChange}
        key={u.id}
        group={u}
      />
    ))

  return (
    <Stack my={"sm"}>
      <GroupAccessButtons
        selectedIDs={selectedIDs}
        onClickDeleteButton={onClickDeleteButton}
        onClickViewButton={onClickViewButton}
      />
      <Table withTableBorder withColumnBorders my={"sm"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox onClick={onLocalSelectAll} />
            </Table.Th>
            <Table.Th>Group</Table.Th>
            <Table.Th>Roles</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{groupRows}</Table.Tbody>
      </Table>
    </Stack>
  )
}

function sortPredicate(g1: Group, g2: Group) {
  const name1 = g1.name.toLowerCase()
  const name2 = g2.name.toLowerCase()

  if (name1 < name2) {
    return -1
  }
  if (name1 > name2) {
    return 1
  }

  // names must be equal
  return 0
}

function Empty() {
  return <Center my={"md"}>No groups</Center>
}
