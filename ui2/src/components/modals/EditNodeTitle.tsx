import {ChangeEvent} from "react"
import {useState} from "react"
import {createRoot} from "react-dom/client"
import {MantineProvider, TextInput} from "@mantine/core"
import theme from "@/themes"
import GenericModal from "@/components/modals/Generic"
import Error from "@/components/modals/Error"
import type {NodeType} from "@/types"
import {MODALS} from "@/cconstants"
import axios, {AxiosError} from "axios"

type Args = {
  node: NodeType
  onOK: (node: NodeType) => void
  onCancel: (msg?: string) => void
}

const EditNodeTitleModal = ({node, onOK, onCancel}: Args) => {
  const [title, setTitle] = useState(node.title)
  const [error, setError] = useState("")

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value

    setTitle(value)
  }

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await axios.patch(
        `/api/nodes/${node.id}`,
        {title},
        {signal}
      )
      let new_node: NodeType = response.data as NodeType
      onOK(new_node)
    } catch (error: any | AxiosError) {
      if (axios.isAxiosError(error)) {
        setError(error.message)
        return false // i.e. do not close dialog
      }
    }
    return true // i.e. close dialog
  }

  const handleCancel = () => {
    // just close the dialog
    setTitle("")
    setError("")
    onCancel()
  }

  return (
    <GenericModal
      modal_title="Create Folder"
      submit_button_title="Create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <TextInput
        data-autofocus
        onChange={handleTitleChanged}
        value={title}
        label="Folder title"
        placeholder="title"
        mt="md"
      />
      {error && <Error message={error} />}
    </GenericModal>
  )
}

function edit_node_title(node: NodeType) {
  let modals = document.getElementById(MODALS)

  let promise = new Promise<NodeType>(function (onOK, onCancel) {
    if (modals) {
      let dom_root = createRoot(modals)
      dom_root.render(
        <MantineProvider theme={theme}>
          <EditNodeTitleModal node={node} onOK={onOK} onCancel={onCancel} />
        </MantineProvider>
      )
    }
  }) // new Promise...

  return promise
}

export default edit_node_title
