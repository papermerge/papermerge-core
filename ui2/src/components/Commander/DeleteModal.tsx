import {useState} from "react"
import {store} from "@/app/store"
import {deleteNodes} from "@/slices/dualPanel/dualPanel"
import GenericModal from "@/components/modals/Generic"
import type {NodeType} from "@/types"

type DeleteNodesModalArgs = {
  nodes: NodeType[]
  onOK: (value: NodeType[]) => void
  onCancel: (reason?: any) => void
}

/* Deletes multiple nodes */
export default function DeleteNodesModal({
  nodes,
  onOK,
  onCancel
}: DeleteNodesModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const nodeTitles = nodes.map(g => g.title).join(",")

  const handleSubmit = async () => {
    store.dispatch(deleteNodes(nodes.map(g => g.id)))
    onOK(nodes)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Nodes"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Delete"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete following nodes: {nodeTitles}?</p>
      {errorMessage}
    </GenericModal>
  )
}
