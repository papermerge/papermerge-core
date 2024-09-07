import {useState} from "react"
import {Checkbox, Text} from "@mantine/core"
import {Button, Modal, Container, Group, Loader} from "@mantine/core"
import Error from "@/components/modals/Error"
import type {FolderType} from "@/types"

import {uploadFile} from "@/slices/uploader"
import {apiSlice} from "@/features/api/slice"
import {useAppDispatch} from "@/app/hooks"

type Args = {
  opened: boolean
  source_files: FileList | File[]
  target: FolderType
  onSubmit: () => void
  onCancel: () => void
}

export const DropFilesModal = ({
  source_files,
  target,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  if (!source_files) {
    return
  }
  const dispatch = useAppDispatch()
  const [error, setError] = useState("")
  const source_titles = [...source_files].map(n => n.name).join(", ")
  const target_title = target.title

  const localSubmit = async () => {
    for (let i = 0; i < source_files.length; i++) {
      dispatch(
        uploadFile({
          file: source_files[i],
          refreshTarget: true,
          skipOCR: false,
          target
        })
      ).then(() => {
        dispatch(apiSlice.util.invalidateTags(["Node"]))
      })
    }

    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    setError("")
    onCancel()
  }

  return (
    <Modal title="Upload Files" opened={opened} onClose={localCancel}>
      <Container>
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
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={false}
            color={"red"}
          >
            Upload
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
