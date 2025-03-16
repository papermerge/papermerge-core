import {Link} from "react-router-dom"
import {useDispatch, useSelector} from "react-redux"
import {Table, Checkbox} from "@mantine/core"
import {
  selectionAdd,
  selectionRemove,
  selectSelectedIds
} from "@/features/groups/groupsSlice"
import type {Group} from "@/types"

type Args = {
  group: Group
}

export default function GroupRow({group}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(group.id))
    } else {
      dispatch(selectionRemove(group.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIds.includes(group.id)}
          onChange={onChange}
        />
      </Table.Td>
      <Table.Td>
        <Link to={`/groups/${group.id}`}>{group.name}</Link>
      </Table.Td>
    </Table.Tr>
  )
}
