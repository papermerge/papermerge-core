import {useEffect, useState} from "react"
import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  selectSelectedIds,
  selectUserById,
  selectUsersByIds,
  clearSelection
} from "@/slices/users"
import {openModal} from "@/components/modals/Generic"

import type {User} from "@/types"

import {RemoveUserModal, RemoveUsersModal} from "./DeleteModal"
import {RootState} from "@/app/types"

export function DeleteUserButton({userId}: {userId: string}) {
  const [redirect, setRedirect] = useState<boolean>(false)
  const navigate = useNavigate()

  const deletedUser = useSelector<RootState>(state =>
    selectUserById(state, userId)
  )

  useEffect(() => {
    if (redirect && deletedUser == null) {
      navigate("/users/")
    }
  }, [deletedUser, redirect])

  const onClick = () => {
    openModal<User[], {userId: string}>(RemoveUserModal, {
      userId: userId
    })
      .then(() => {
        setRedirect(true)
      })
      .catch(() => {})
  }
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}

/* Deletes one or multiple users (with confirmation) */
export function DeleteUsersButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const users = useSelector<RootState>(state =>
    selectUsersByIds(state, selectedIds)
  ) as Array<User>

  const onClick = () => {
    openModal<User[], {users: Array<User>}>(RemoveUsersModal, {
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
