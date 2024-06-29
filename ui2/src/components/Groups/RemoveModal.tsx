import {useState} from "react"
import {store} from "@/app/store"
import {removeGroups} from "@/slices/groups"
import GenericModal from "@/components/modals/Generic"
import type {Group} from "@/types"

type GenericModalArgs = {
  groups: Group[]
  onOK: (value: Group[]) => void
  onCancel: (reason?: any) => void
}

export default function RemoveGroupModal({
  groups,
  onOK,
  onCancel
}: GenericModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (signal: AbortSignal) => {
    store.dispatch(removeGroups(groups.map(g => g.id)))
    onOK(groups)
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Remove group"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <p>Are you sure you want to delete groups?</p>
      {errorMessage}
    </GenericModal>
  )
}
