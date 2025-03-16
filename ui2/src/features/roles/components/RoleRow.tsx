import {
  selectionAdd,
  selectionRemove,
  selectSelectedIds
} from "@/features/roles/rolesSlice"
import type {Role} from "@/types"
import {Checkbox, Table} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {Link} from "react-router-dom"

type Args = {
  role: Role
}

export default function RoleRow({role}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(role.id))
    } else {
      dispatch(selectionRemove(role.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox checked={selectedIds.includes(role.id)} onChange={onChange} />
      </Table.Td>
      <Table.Td>
        <Link to={`/roles/${role.id}`}>{role.name}</Link>
      </Table.Td>
    </Table.Tr>
  )
}
