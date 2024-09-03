import {Link, useNavigation} from "react-router-dom"
import {Breadcrumbs, Box, LoadingOverlay, Group, Loader} from "@mantine/core"

import type {ColoredTagType} from "@/types"
import {useGetTagQuery} from "@/features/tags/apiSlice"
import TagForm from "./TagForm"
import EditButton from "./EditButton"
import {DeleteTagButton} from "./DeleteButton"

interface TagDetailsArgs {
  tagId: string
}

export default function TagDetails({tagId}: TagDetailsArgs) {
  const {data, isLoading} = useGetTagQuery(tagId)

  if (isLoading || !data) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path tag={null} />
        <TagForm tag={null} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path tag={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <TagForm tag={data} />
    </>
  )
}

function Path({tag}: {tag: ColoredTagType | null}) {
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/tags/">Tags</Link>
        <Link to={`/tags/${tag?.id}`}>{tag?.name}</Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size={"sm"} />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton tagId={modelId} />
      <DeleteTagButton tagId={modelId!} />
    </Group>
  )
}
