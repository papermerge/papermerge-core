import {Button, Group, Loader, Modal, TagsInput} from "@mantine/core"
import {useEffect, useState} from "react"

import Error from "@/components/Error"
import {
  useGetNodeTagsQuery,
  useUpdateNodeTagsMutation
} from "@/features/nodes/apiSlice"
import {useGetTagsQuery} from "@/features/tags/apiSlice"
import type {EntityWithTags} from "@/types"

interface Args {
  node: EntityWithTags
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTagsModal = ({node, onSubmit, onCancel, opened}: Args) => {
  /*
  Edit Tags Modal
  */
  const {data, isLoading: isLoadingTags} = useGetNodeTagsQuery(node.id)
  const [updateNodeTags, {isLoading, isSuccess}] = useUpdateNodeTagsMutation()
  const {data: allTagsData, isLoading: isLoadingAllTagsData} = useGetTagsQuery()
  const [allTagNames, setAllTagNames] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>(node.tags.map(t => t.name))
  const [error, setError] = useState("")

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
    }
  }, [isSuccess])

  useEffect(() => {
    if (data) {
      setTags(data.map(t => t.name))
    }
  }, [data, isLoadingTags])

  useEffect(() => {
    if (allTagsData) {
      setAllTagNames(allTagsData.map(t => t.name))
    }
  }, [allTagsData, isLoadingAllTagsData])

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
