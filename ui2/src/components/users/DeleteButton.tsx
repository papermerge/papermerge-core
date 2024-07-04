import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"

import {
  selectSelectedIds,
  selectUsersByIds,
  clearSelection
} from "@/slices/users"
import {openModal} from "@/components/modals/Generic"

import type {User} from "@/types"

import RemoveUserModal from "./RemoveModal"
import {RootState} from "@/app/types"

export default function DeleteButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const users = useSelector<RootState>(state =>
    selectUsersByIds(state, selectedIds)
  ) as Array<User>

  const onClick = () => {
    openModal<User[], {users: Array<User>}>(RemoveUserModal, {
      users: users
    })
      .then(() => {
        dispatch(clearSelection())
      })
      .catch(() => dispatch(clearSelection()))
  }
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}
