import {useState} from "react"
import {store} from "@/app/store"
import {removeUsers} from "@/slices/users"
import GenericModal from "@/components/modals/Generic"
import type {User} from "@/types"

type RemoveUsersModalArgs = {
  users: User[]
  onOK: (value: User[]) => void
  onCancel: (reason?: any) => void
}

/* Removes multiple users */
export function RemoveUsersModal({
  users,
  onOK,
  onCancel
}: RemoveUsersModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const usernames = users.map(u => u.username).join(",")

  const handleSubmit = async () => {
    store.dispatch(removeUsers(users.map(u => u.id)))
    onOK(users)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Users"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete following users: {usernames}?</p>
      {errorMessage}
    </GenericModal>
  )
}

type RemoveUserModalArgs = {
  userId: string
  onOK: (value: string) => void
  onCancel: (reason?: any) => void
}

/* Removes one specific user */
export function RemoveUserModal({userId, onOK, onCancel}: RemoveUserModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    await store.dispatch(removeUsers([userId]))
    onOK(userId)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Users"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete user?</p>
      {errorMessage}
    </GenericModal>
  )
}
