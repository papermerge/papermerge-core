import {useGetCustomFieldsQuery} from "@/features/custom-fields/apiSlice"
import {
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  MultiSelect,
  TextInput,
  Textarea
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
  const [name, setName] = useState<string>("")
  const [pathTemplate, setPathTemplate] = useState<string>("")

  const {data: allCustomFields = []} = useGetCustomFieldsQuery()
  const {data, isLoading} = useGetDocumentTypeQuery(documentTypeId)
  const [updateDocumentType, {isLoading: isLoadingGroupUpdate}] =
    useEditDocumentTypeMutation()

  const [customFieldIDs, setCustomFieldIDs] = useState<string[]>([])

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
      setPathTemplate(data.path_template || "")
      setCustomFieldIDs(data.custom_fields.map(cf => cf.id) || [])
    }
  }

  const onLocalSubmit = async () => {
    const updatedDocumentType = {
      id: documentTypeId,
      name,
      path_template: pathTemplate,
      custom_field_ids: customFieldIDs
    }
    try {
      await updateDocumentType(updatedDocumentType).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
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
      <MultiSelect
        label="Custom Fields"
        placeholder="Pick value"
        onChange={setCustomFieldIDs}
        searchable
        data={allCustomFields.map(i => {
          return {label: i.name, value: i.id}
        })}
        value={customFieldIDs}
      />
      <Textarea
        label="Path Template"
        resize="vertical"
        autosize
        minRows={6}
        value={pathTemplate}
        onChange={event => setPathTemplate(event.currentTarget.value)}
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
