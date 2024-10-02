import {
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {
  useEditDocumentTypeMutation,
  useGetDocumentTypeQuery
} from "@/features/document-types/apiSlice"

interface Args {
  opened: boolean
  documentTypeId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditDocumentTypeModal({
  documentTypeId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {data, isLoading} = useGetDocumentTypeQuery(documentTypeId)
  const [updateCustomField, {isLoading: isLoadingGroupUpdate}] =
    useEditDocumentTypeMutation()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
    }
  }

  const onLocalSubmit = async () => {
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={"Edit Document Type"}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <LoadingOverlay
        visible={data == null || isLoading}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <TextInput
        value={name}
        onChange={e => setName(e.currentTarget.value)}
        label="Name"
        placeholder="name"
      />

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          Cancel
        </Button>
        <Group>
          {isLoadingGroupUpdate && <Loader size="sm" />}
          <Button disabled={isLoadingGroupUpdate} onClick={onLocalSubmit}>
            Update
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
