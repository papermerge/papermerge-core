import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllGroups,
  selectionAddMany,
  selectSelectedIds,
  clearSelection
} from "@/slices/groups"
import GroupRow from "./GroupRow"
import ActionButtons from "./ActionButtons"
import Pagination from "./Pagination"

export default function Groups() {
  const selectedIds = useSelector(selectSelectedIds)
  const groups = useSelector(selectAllGroups)
  const dispatch = useDispatch()

  const onCheckAll = (checked: boolean) => {
    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(groups.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
    }
  }

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
    <Stack>
      <ActionButtons />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={groups.length == selectedIds.length}
                onClick={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{groupRows}</Table.Tbody>
      </Table>
      <Pagination />
    </Stack>
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
