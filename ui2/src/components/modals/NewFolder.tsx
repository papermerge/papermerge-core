import {ChangeEvent} from "react"
import {useState, useEffect} from "react"
import {TextInput, Loader, Group, Button, Modal} from "@mantine/core"
import axios, {AxiosResponse} from "axios"
import {useAddNewFolderMutation} from "@/features/nodes/apiSlice"

type CreateFolderType = {
  title: string
  parent_id: string
  ctype: "folder"
}

type Args = {
  parent_id: string
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

async function api_create_new_folder(
  title: string,
  parent_id: string,
  signal: AbortSignal
): Promise<AxiosResponse> {
  let data: CreateFolderType = {
    title: title,
    parent_id: parent_id,
    ctype: "folder"
  }

  return axios.post("/api/nodes/", data, {
    signal
  })
}

export const NewFolderModal = ({
  parent_id,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const [addNewFolder, {isLoading, isError, isSuccess}] =
    useAddNewFolderMutation()
  const [title, setTitle] = useState("")

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value

    setTitle(value)
  }

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const onLocalSubmit = async () => {
    let data: CreateFolderType = {
      title: title,
      parent_id: parent_id,
      ctype: "folder"
    }
    try {
      await addNewFolder(data)
    } catch (error: any) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setTitle("")
  }

  return (
    <Modal title={"New Tag"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        data-autofocus
        onChange={handleTitleChanged}
        label="Folder title"
        placeholder="title"
        mt="md"
      />
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
