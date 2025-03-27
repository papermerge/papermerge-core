import {
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Text,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {useAddNewGroupMutation} from "@/features/groups/apiSlice"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewGroupModal({onCancel, onSubmit, opened}: Args) {
  const [addNewGroup, {isLoading, isError, isSuccess}] =
    useAddNewGroupMutation()
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [withSpecialFolders, setWithSpecialFolders] = useState<boolean>(false)

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
    }
  }, [isSuccess])

  const reset = () => {
    setName("")
    setError("")
    setWithSpecialFolders(false)
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      name: name!,
      with_special_folders: withSpecialFolders
    }
    try {
      await addNewGroup(updatedData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
    reset()
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const onNameChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value)
  }

  return (
    <Modal
      title={"New Group"}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <TextInput
        value={name}
        onChange={onNameChangeHandler}
        label="Name"
        placeholder="Group name"
      />
      <Checkbox
        my="md"
        label="For this group create special folders: inbox and home"
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
