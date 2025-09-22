import Check from "@/components/Check"
import {
  selectionAdd,
  selectionRemove,
  selectSelectedIds
} from "@/features/groups/storage/group"
import type {Group} from "@/types.d/groups"
import {Checkbox, Table} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {Link} from "react-router-dom"

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
      <Table.Td>
        <Check check={Boolean(group.home_folder_id && group.inbox_folder_id)} />
      </Table.Td>
    </Table.Tr>
  )
}
