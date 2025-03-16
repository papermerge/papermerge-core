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
  useEditGroupMutation,
  useGetGroupQuery
} from "@/features/groups/apiSlice"

interface Args {
  opened: boolean
  groupId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditGroupModal({
  groupId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {data, isLoading} = useGetGroupQuery(groupId)
  const [updateGroup, {isLoading: isLoadingGroupUpdate}] =
    useEditGroupMutation()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name)
    } else {
      setName("")
    }
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      id: groupId,
      name: name!
    }
    await updateGroup(updatedData)
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={"Edit Group"}
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
            Update Group
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
