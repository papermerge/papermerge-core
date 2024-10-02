import type {CustomFieldDataType} from "@/types"
import {
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  NativeSelect,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {CUSTOM_FIELD_DATA_TYPES} from "@/cconstants"
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
  const [dataType, setDataType] = useState<CustomFieldDataType>("string")

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
    }
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      id: customFieldId,
      name: name,
      data_type: dataType
    }
    await updateCustomField(updatedData)
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
        placeholder="name"
      />
      <NativeSelect
        mt="sm"
        label="Data Type"
        value={dataType}
        data={CUSTOM_FIELD_DATA_TYPES}
        onChange={e =>
          setDataType(e.currentTarget.value as CustomFieldDataType)
        }
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
