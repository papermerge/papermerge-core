import {useEffect, useState} from "react"

import {useAddDocumentTypeMutation} from "@/features/document-types/apiSlice"
import {Button, Group, Loader, Modal, Text, TextInput} from "@mantine/core"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewDocumentTypeModal({
  onSubmit,
  onCancel,
  opened
}: Args) {
  const [addDocumentTypeField, {isLoading, isError, isSuccess}] =
    useAddDocumentTypeMutation()
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const onNameChange = (value: string) => {
    setName(value)
  }

  const onLocalSubmit = async () => {}

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setName("")
    setError("")
  }

  return (
    <Modal title={"New Document Type"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        label="Name"
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder="Name"
      />
      {isError && <Text c="red">{`${error}`}</Text>}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          Cancel
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onLocalSubmit}>
            Submit
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
