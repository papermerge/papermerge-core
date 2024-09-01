import {useState} from "react"
import {useDeleteUserMutation} from "@/features/api/slice"

import GenericModal from "@/components/modals/Generic"

type RemoveUsersModalArgs = {
  userIds: string[]
  onOK: () => void
  onCancel: (reason?: any) => void
}

/* Removes multiple users */
export function RemoveUsersModal({
  userIds,
  onOK,
  onCancel
}: RemoveUsersModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedUser] = useDeleteUserMutation()

  const handleSubmit = async () => {
    await Promise.all(userIds.map(i => deletedUser(i)))
    onOK()
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
      <p>Are you sure you want to delete selected users?</p>
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
  const [deletedUser] = useDeleteUserMutation()
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    await deletedUser(userId)
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
