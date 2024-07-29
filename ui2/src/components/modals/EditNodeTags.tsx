import {useState} from "react"
import {createRoot} from "react-dom/client"
import {MantineProvider, TagsInput} from "@mantine/core"
import theme from "@/themes"
import GenericModal from "@/components/modals/Generic"
import Error from "@/components/modals/Error"
import type {NodeType} from "@/types"
import {MODALS} from "@/cconstants"
import axios, {AxiosError} from "axios"
import {store} from "@/app/store"

type Args = {
  node: NodeType
  onOK: (node: NodeType) => void
  onCancel: (msg?: string) => void
}

const EditNodeTagsModal = ({node, onOK, onCancel}: Args) => {
  const state = store.getState()
  const allTagNames = Object.values(state.tags.entities).map(t => t.name)
  const [tags, setTags] = useState<string[]>(node.tags.map(t => t.name))
  const [error, setError] = useState("")

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await axios.post(`/api/nodes/${node.id}/tags`, tags, {
        signal
      })
      let new_node = response.data as NodeType
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
    setTags([])
    setError("")
    onCancel()
  }

  return (
    <GenericModal
      modal_title="Edit Tags"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <TagsInput
        data-autofocus
        onChange={setTags}
        value={tags}
        label="Tags"
        data={allTagNames}
        mt="md"
      />
      {error && <Error message={error} />}
    </GenericModal>
  )
}

function edit_node_tags(node: NodeType) {
  let modals = document.getElementById(MODALS)

  let promise = new Promise<NodeType>(function (onOK, onCancel) {
    if (modals) {
      let dom_root = createRoot(modals)
      dom_root.render(
        <MantineProvider theme={theme}>
          <EditNodeTagsModal node={node} onOK={onOK} onCancel={onCancel} />
        </MantineProvider>
      )
    }
  }) // new Promise...

  return promise
}

export default edit_node_tags
