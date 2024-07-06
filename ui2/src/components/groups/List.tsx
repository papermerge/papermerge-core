import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllGroups,
  selectionAddMany,
  selectSelectedIds,
  clearSelection,
  fetchGroups,
  selectPagination,
  selectLastPageSize
} from "@/slices/groups"

import Pagination from "@/components/Pagination"
import GroupRow from "./GroupRow"
import ActionButtons from "./ActionButtons"

export default function GroupsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const groups = useSelector(selectAllGroups)
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)
  const lastPageSize = useSelector(selectLastPageSize)

  const onCheckAll = (checked: boolean) => {
    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(groups.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
    }
  }

  const onPageNumberChange = (page: number) => {
    dispatch(fetchGroups({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchGroups({pageNumber: 1, pageSize: parseInt(value)}))
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
                onChange={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
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
        <div>Currently there are no groups</div>
      </Stack>
    </Center>
  )
}
