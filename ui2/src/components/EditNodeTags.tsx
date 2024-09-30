import {Button, Group, Loader, Modal, TagsInput} from "@mantine/core"
import {useEffect, useState} from "react"

import Error from "@/components/Error"
import {useUpdateNodeTagsMutation} from "@/features/nodes/apiSlice"
import type {EntityWithTags} from "@/types"

interface Args {
  node: EntityWithTags
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTagsModal = ({node, onSubmit, onCancel, opened}: Args) => {
  // const state = store.getState()
  const [updateNodeTags, {isLoading, isSuccess}] = useUpdateNodeTagsMutation()
  const allTagNames: string[] = [] //Object.values(state.tags.entities).map(t => t.name)
  const [tags, setTags] = useState<string[]>(node.tags.map(t => t.name))
  const [error, setError] = useState("")

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  useEffect(() => {
    if (node) {
      setTags(node.tags.map(t => t.name))
    }
  }, [node])

  const onLocalSubmit = async () => {
    try {
      await updateNodeTags({id: node.id, tags: tags})
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
    setTags(node.tags.map(t => t.name))
    setError("")
  }

  return (
    <Modal title={"Edit Tags"} opened={opened} onClose={onLocalCancel}>
      <TagsInput
        data-autofocus
        onChange={setTags}
        value={tags}
        label="Tags"
        data={allTagNames}
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
