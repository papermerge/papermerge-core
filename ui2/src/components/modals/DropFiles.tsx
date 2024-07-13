import {useState} from "react"
import {createRoot} from "react-dom/client"
import {Checkbox, MantineProvider, Text} from "@mantine/core"
import {theme} from "@/app/theme"
import GenericModal from "@/components/modals/Generic"
import Error from "@/components/modals/Error"
import type {NodeType, FolderType} from "@/types"
import {MODALS} from "@/cconstants"
import axios, {AxiosError} from "axios"
import {store} from "@/app/store"

type Args = {
  source_files: File[]
  target: FolderType
  onOK: (node: NodeType) => void
  onCancel: (msg?: string) => void
}

const DropFilesModal = ({source_files, target, onOK, onCancel}: Args) => {
  const state = store.getState()
  const [error, setError] = useState("")
  const source_titles = [...source_files].map(n => n.name).join(", ")
  const target_title = target.title

  const handleSubmit = async (signal: AbortSignal) => {
    return true
  }

  const handleCancel = () => {
    // just close the dialog
    setError("")
    onCancel()
  }

  return (
    <GenericModal
      modal_title="Upload documents"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      Are you sure you want to upload
      <Text span c="blue">
        {` ${source_titles} `}
      </Text>
      to
      <Text span c="green">
        {` ${target_title}`}
      </Text>
      ?
      <Checkbox mt="md" mb="md" label="Skip OCR" />
      {error && <Error message={error} />}
    </GenericModal>
  )
}

type DropFileArgs = {
  source_files: File[]
  target: FolderType
}

function drop_files({source_files, target}: DropFileArgs) {
  let modals = document.getElementById(MODALS)

  let promise = new Promise<NodeType>(function (onOK, onCancel) {
    if (modals) {
      let dom_root = createRoot(modals)
      dom_root.render(
        <MantineProvider theme={theme}>
          <DropFilesModal
            source_files={source_files}
            target={target}
            onOK={onOK}
            onCancel={onCancel}
          />
        </MantineProvider>
      )
    }
  }) // new Promise...

  return promise
}

export default drop_files
