import {useAppSelector} from "@/app/hooks"
import {Button, Group, Loader, Modal, TagsInput} from "@mantine/core"
import {useEffect, useState} from "react"

import Error from "@/components/Error"
import {
  useGetNodeTagsQuery,
  useUpdateNodeTagsMutation
} from "@/features/nodes/apiSlice"
import {selectNodeById} from "@/features/nodes/nodesSlice"
import {useGetTagsQuery} from "@/features/tags/apiSlice"
import type {EntityWithTags} from "@/types"
import {useTranslation} from "react-i18next"

interface Args {
  node: EntityWithTags
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTagsModal = ({node, onSubmit, onCancel, opened}: Args) => {
  const {t} = useTranslation()
  /*
  Edit Tags Modal
  */
  const {data, isLoading: isLoadingTags} = useGetNodeTagsQuery(node.id)
  const nodeDetails = useAppSelector(s => selectNodeById(s, node.id))

  const [updateNodeTags, {isLoading, isSuccess}] = useUpdateNodeTagsMutation()
  const {data: allTagsData, isLoading: isLoadingAllTagsData} = useGetTagsQuery(
    nodeDetails?.group_id
  )
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
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onLocalSubmit}>
            {t("common.submit")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
