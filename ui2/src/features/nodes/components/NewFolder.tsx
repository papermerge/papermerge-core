import {useAddNewFolderMutation} from "@/features/nodes/apiSlice"
import {Button, Group, Loader, Modal, TextInput} from "@mantine/core"
import {ChangeEvent, useEffect, useRef, useState} from "react"

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

export const NewFolderModal = ({
  parent_id,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const [addNewFolder, {isLoading, isSuccess}] = useAddNewFolderMutation()
  const [title, setTitle] = useState("")
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // handle "enter" keyboard press
    document.addEventListener("keydown", handleKeydown, false)

    return () => {
      document.removeEventListener("keydown", handleKeydown, false)
    }
  }, [])

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value

    setTitle(value)
  }

  const handleKeydown = async (e: KeyboardEvent) => {
    switch (e.code) {
      case "Enter":
        /*
         * The intuitive code here would be:
         *```
         * await onLocalSubmit()
         *```
         * However, the `await onLocalSubmit()` code will submit only
         * initial value of the `title` field. Is that because of
         * useEffect / addEventListener / react magic ?
         */
        if (ref.current) {
          ref.current.click()
        }
        break
    }
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
    <Modal title={"New Folder"} opened={opened} onClose={onLocalCancel}>
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
          <Button ref={ref} disabled={isLoading} onClick={onLocalSubmit}>
            Submit
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
