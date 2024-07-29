import {ChangeEvent} from "react"
import {useState} from "react"
import {createRoot} from "react-dom/client"
import {MantineProvider, TextInput} from "@mantine/core"
import theme from "@/themes"
import GenericModal from "@/components/modals/Generic"

import type {NodeType} from "@/types"
import {MODALS} from "@/cconstants"
import axios, {AxiosResponse} from "axios"

type CreateFolderType = {
  title: string
  parent_id: string
  ctype: "folder"
}

type Args = {
  parent_id: string
  onOK: (node: NodeType) => void
  onCancel: (msg?: string) => void
}

async function api_create_new_folder(
  title: string,
  parent_id: string,
  signal: AbortSignal
): Promise<AxiosResponse> {
  let data: CreateFolderType = {
    title: title,
    parent_id: parent_id,
    ctype: "folder"
  }

  return axios.post("/api/nodes/", data, {
    signal
  })
}

const NewFolderModal = ({parent_id, onOK, onCancel}: Args) => {
  const [title, setTitle] = useState("")

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value

    setTitle(value)
  }

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_create_new_folder(title, parent_id, signal)
      let new_node: NodeType = response.data as NodeType
      onOK(new_node)
    } catch (error: any) {
      onCancel(error.toString())
    }
    return true
  }

  const handleCancel = () => {
    setTitle("")

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
        label="Folder title"
        placeholder="title"
        mt="md"
      />
    </GenericModal>
  )
}

function create_new_folder(parent_id: string) {
  let modals = document.getElementById(MODALS)

  let promise = new Promise<NodeType>(function (onOK, onCancel) {
    if (modals) {
      let dom_root = createRoot(modals)
      dom_root.render(
        <MantineProvider theme={theme}>
          <NewFolderModal
            parent_id={parent_id}
            onOK={onOK}
            onCancel={onCancel}
          />
        </MantineProvider>
      )
    }
  }) // new Promise...

  return promise
}

export default create_new_folder
