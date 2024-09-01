import {useState} from "react"
import {store} from "@/app/store"
import GenericModal from "@/components/modals/Generic"
import type {Group} from "@/types"
import {useDeleteGroupMutation} from "@/features/api/slice"

type RemoveGroupsModalArgs = {
  groupIds: string[]
  onOK: (value: Group[]) => void
  onCancel: (reason?: any) => void
}

/* Removes multiple groups */
export function RemoveGroupsModal({
  groupIds,
  onOK,
  onCancel
}: RemoveGroupsModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedGroup] = useDeleteGroupMutation()
  //const groupNames = groups.map(g => g.name).join(",")

  const handleSubmit = async () => {
    await Promise.all(groupIds.map(i => deletedGroup(i)))
    onOK([])
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
      <p>Are you sure you want to delete selected groups?</p>
      {errorMessage}
    </GenericModal>
  )
}

type RemoveGroupModalArgs = {
  groupId: string
  onOK: (value: string) => void
  onCancel: (reason?: any) => void
}

/* Removes one specific group */
export function RemoveGroupModal({
  groupId,
  onOK,
  onCancel
}: RemoveGroupModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedGroup] = useDeleteGroupMutation()
  const handleSubmit = async () => {
    //await store.dispatch(removeGroups([groupId]))
    await deletedGroup(groupId)

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
