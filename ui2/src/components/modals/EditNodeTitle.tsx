import {ChangeEvent} from "react"
import {useState, useEffect} from "react"
import {TextInput, Loader, Group, Button, Modal} from "@mantine/core"
import Error from "@/components/modals/Error"
import type {NodeType} from "@/types"
import {useRenameFolderMutation} from "@/features/nodes/apiSlice"

interface Args {
  node: NodeType
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTitleModal = ({
  node,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const [renameFolder, {isLoading, isSuccess}] = useRenameFolderMutation()
  const [title, setTitle] = useState(node.title)
  const [error, setError] = useState("")

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value

    setTitle(value)
  }

  const onLocalSubmit = async () => {
    const data = {
      title: title,
      id: node.id
    }
    try {
      await renameFolder(data)
    } catch (error: any) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    onCancel()
    reset()
  }

  const reset = () => {
    setTitle("")
    setError("")
  }

  return (
    <Modal title={"New Tag"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        data-autofocus
        onChange={handleTitleChanged}
        value={title}
        label="Folder title"
        placeholder="title"
        mt="md"
      />
      {error && <Error message={error} />}

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
