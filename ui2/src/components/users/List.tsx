import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllUsers,
  selectionAddMany,
  selectSelectedIds,
  clearSelection,
  fetchUsers,
  selectPagination,
  selectLastPageSize
} from "@/slices/users"
import Pagination from "@/components/Pagination"

import UserRow from "./UserRow"
import ActionButtons from "./ActionButtons"

export default function UsersList() {
  const selectedIds = useSelector(selectSelectedIds)
  const users = useSelector(selectAllUsers)
  const pagination = useSelector(selectPagination)
  const lastPageSize = useSelector(selectLastPageSize)
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

  const onPageNumberChange = (page: number) => {
    dispatch(fetchUsers({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchUsers({pageNumber: 1, pageSize: parseInt(value)}))
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
            <Table.Th>ID</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{groupRows}</Table.Tbody>
      </Table>
      <Pagination
        pagination={pagination}
        onPageNumberChange={onPageNumberChange}
        onPageSizeChange={onPageSizeChange}
        lastPageSize={lastPageSize}
      />
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
