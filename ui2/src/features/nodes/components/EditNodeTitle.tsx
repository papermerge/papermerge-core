import {useRenameFolderMutation} from "@/features/nodes/apiSlice"
import type {EditEntityTitle} from "@/types"
import {Button, Group, Loader, Modal, TextInput} from "@mantine/core"
import {ChangeEvent, useEffect, useRef, useState} from "react"

import Error from "@/components/Error"

interface Args {
  node: EditEntityTitle
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
  const [renameFolder, {isLoading}] = useRenameFolderMutation()
  const ref = useRef<HTMLButtonElement>(null)
  const [title, setTitle] = useState(node.title)
  const [error, setError] = useState("")

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

  const onLocalSubmit = async () => {
    const data = {
      title: title,
      id: node.id
    }

    try {
      await renameFolder(data)
      onSubmit()
      reset() // sets error message back to empty string
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
    setError("")
  }

  return (
    <Modal title={"Edit Title"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        data-autofocus
        onChange={handleTitleChanged}
        value={title}
        label="New Title"
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
          <Button ref={ref} disabled={isLoading} onClick={onLocalSubmit}>
            Submit
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
