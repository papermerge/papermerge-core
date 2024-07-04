import {useState} from "react"
import {store} from "@/app/store"
import {removeUsers} from "@/slices/users"
import GenericModal from "@/components/modals/Generic"
import type {User} from "@/types"

type GenericModalArgs = {
  users: User[]
  onOK: (value: User[]) => void
  onCancel: (reason?: any) => void
}

export default function RemoveUsersModal({
  users,
  onOK,
  onCancel
}: GenericModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const usernames = users.map(u => u.username).join(",")

  const handleSubmit = async (signal: AbortSignal) => {
    store.dispatch(removeUsers(users.map(u => u.id)))
    onOK(users)
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
