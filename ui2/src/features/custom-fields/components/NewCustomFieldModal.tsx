import {useEffect, useState} from "react"

import {useAddNewCustomFieldMutation} from "@/features/custom-fields/apiSlice"
import {CustomFieldDataType} from "@/types"
import {
  Button,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Text,
  TextInput
} from "@mantine/core"

const DATA_TYPES: Array<CustomFieldDataType> = [
  "string",
  "url",
  "date",
  "boolean",
  "int",
  "float",
  "monetary",
  "documentlink",
  "select"
]

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewCustomFieldModal({
  onSubmit,
  onCancel,
  opened
}: Args) {
  const [addNewCustomField, {isLoading, isError, isSuccess}] =
    useAddNewCustomFieldMutation()
  const [name, setName] = useState<string>("")
  const [dataType, setDataType] = useState<CustomFieldDataType>("string")
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

  const onLocalSubmit = async () => {
    const newCustomFieldData = {
      name,
      data_type: dataType
    }
    try {
      await addNewCustomField(newCustomFieldData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setName("")
    setDataType("string")
    setError("")
  }

  return (
    <Modal title={"New Custom Field"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        label="Name"
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder="Name"
      />
      <NativeSelect
        mt="sm"
        label="Data Type"
        value={dataType}
        data={DATA_TYPES}
        onChange={e =>
          setDataType(e.currentTarget.value as CustomFieldDataType)
        }
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
