import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllUsers,
  selectionAddMany,
  selectSelectedIds,
  clearSelection
} from "@/slices/users"
import UserRow from "./UserRow"
import ActionButtons from "./ActionButtons"
import Pagination from "./Pagination"

export default function UsersList() {
  const selectedIds = useSelector(selectSelectedIds)
  const users = useSelector(selectAllUsers)
  const dispatch = useDispatch()

  const onCheckAll = (checked: boolean) => {
    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(users.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
    }
  }

  if (users.length == 0) {
    return (
      <div>
        <ActionButtons />
        <Empty />
      </div>
    )
  }

  const groupRows = users.map(u => <UserRow key={u.id} user={u} />)

  return (
    <Stack>
      <ActionButtons />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={users.length == selectedIds.length}
                onChange={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Username</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>UUID</Table.Th>
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
        <div>Currently there are no users</div>
      </Stack>
    </Center>
  )
}
