import {Link} from "react-router-dom"
import {useDispatch, useSelector} from "react-redux"
import {Table, Checkbox} from "@mantine/core"

import {
  selectionAdd,
  selectionRemove,
  selectSelectedIds
} from "@/features/users/usersSlice"

import type {User} from "@/types"

type Args = {
  user: User
}

export default function UserRow({user}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(user.id))
    } else {
      dispatch(selectionRemove(user.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox checked={selectedIds.includes(user.id)} onChange={onChange} />
      </Table.Td>
      <Table.Td>
        <Link to={`/users/${user.id}`}>{user.username}</Link>
      </Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.id}</Table.Td>
    </Table.Tr>
  )
}
