import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {selectSelectedIds, clearSelection} from "@/features/users/usersSlice"

import {RemoveUserModal, RemoveUsersModal} from "./DeleteModal"

export function DeleteUserButton({userId}: {userId: string}) {
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/users/")
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        Delete
      </Button>
      <RemoveUserModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        userId={userId}
      />
    </>
  )
}

/* Deletes one or multiple users (with confirmation) */
export function DeleteUsersButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)

  const onSubmit = () => {
    close()
    dispatch(clearSelection())
  }

  const onCancel = () => {
    close()
    dispatch(clearSelection())
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        Delete
      </Button>
      <RemoveUsersModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        userIds={selectedIds}
      />
    </>
  )
}
