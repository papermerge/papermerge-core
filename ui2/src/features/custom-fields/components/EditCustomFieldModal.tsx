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
  useEditCustomFieldMutation,
  useGetCustomFieldQuery
} from "@/features/custom-fields/apiSlice"

interface Args {
  opened: boolean
  customFieldId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditGroupModal({
  customFieldId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {data, isLoading} = useGetCustomFieldQuery(customFieldId)
  const [updateCustomField, {isLoading: isLoadingGroupUpdate}] =
    useEditCustomFieldMutation()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {}

  const onLocalSubmit = async () => {
    //await updateGroup(updatedData)
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={"Edit Custom Field"}
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
        placeholder="Group name"
      />

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          Cancel
        </Button>
        <Group>
          {isLoadingGroupUpdate && <Loader size="sm" />}
          <Button disabled={isLoadingGroupUpdate} onClick={onLocalSubmit}>
            Update Custom Field
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
