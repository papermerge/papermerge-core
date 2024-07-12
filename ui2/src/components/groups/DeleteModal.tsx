import {useState} from "react"
import {store} from "@/app/store"
import {removeGroups} from "@/slices/groups"
import GenericModal from "@/components/modals/Generic"
import type {Group} from "@/types"

type RemoveGroupsModalArgs = {
  groups: Group[]
  onOK: (value: Group[]) => void
  onCancel: (reason?: any) => void
}

/* Removes multiple groups */
export function RemoveGroupsModal({
  groups,
  onOK,
  onCancel
}: RemoveGroupsModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const groupNames = groups.map(g => g.name).join(",")

  const handleSubmit = async () => {
    store.dispatch(removeGroups(groups.map(g => g.id)))
    onOK(groups)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Groups"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete following groups: {groupNames}?</p>
      {errorMessage}
    </GenericModal>
  )
}

type RemoveGroupModalArgs = {
  groupId: number
  onOK: (value: number) => void
  onCancel: (reason?: any) => void
}

/* Removes one specific group */
export function RemoveGroupModal({
  groupId,
  onOK,
  onCancel
}: RemoveGroupModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    await store.dispatch(removeGroups([groupId]))

    onOK(groupId)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Group"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete this group?</p>
      {errorMessage}
    </GenericModal>
  )
}
