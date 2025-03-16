import {Button, Group, Loader, Modal, Text, TextInput} from "@mantine/core"
import {useEffect, useState} from "react"

import {useAddNewGroupMutation} from "@/features/groups/apiSlice"

const INITIAL_SCOPES = {
  "user.me": true,
  "page.view": true,
  "node.view": true,
  "ocrlang.view": true
}

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
  const [scopes, setScopes] = useState<Record<string, boolean>>(INITIAL_SCOPES)

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
    setScopes(INITIAL_SCOPES)
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      scopes: Object.keys(scopes),
      name: name!
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
