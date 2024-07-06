import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllTags,
  selectionAddMany,
  selectSelectedIds,
  clearSelection,
  selectPagination,
  fetchTags,
  selectLastPageSize
} from "@/slices/tags"

import Pagination from "@/components/Pagination"
import TagRow from "./TagRow"
import ActionButtons from "./ActionButtons"

export default function TagsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const tags = useSelector(selectAllTags)
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)
  const lastPageSize = useSelector(selectLastPageSize)

  const onCheckAll = (checked: boolean) => {
    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(tags.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
    }
  }

  const onPageNumberChange = (page: number) => {
    dispatch(fetchTags({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchTags({pageNumber: 1, pageSize: parseInt(value)}))
    }
  }

  if (tags.length == 0) {
    return (
      <div>
        <ActionButtons />
        <Empty />
      </div>
    )
  }

  const tagRows = tags.map(t => <TagRow key={t.id} tag={t} />)

  return (
    <Stack>
      <ActionButtons />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={tags.length == selectedIds.length}
                onChange={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Pinned?</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>ID</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tagRows}</Table.Tbody>
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
        <div>Currently there are no tags</div>
      </Stack>
    </Center>
  )
}
