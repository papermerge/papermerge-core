import {Center, Stack, Table, Checkbox} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectAllTags,
  selectionAddMany,
  selectSelectedIds,
  clearSelection
} from "@/slices/tags"
import TagRow from "./TagRow"
import ActionButtons from "./ActionButtons"
import Pagination from "./Pagination"

export default function TagsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const tags = useSelector(selectAllTags)
  const dispatch = useDispatch()

  const onCheckAll = (checked: boolean) => {
    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(tags.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
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
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tagRows}</Table.Tbody>
      </Table>
      <Pagination />
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
