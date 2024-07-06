import {useSelector} from "react-redux"
import {Link} from "react-router-dom"
import {Breadcrumbs, Box, LoadingOverlay, Group} from "@mantine/core"

import {selectTagDetails} from "@/slices/tagDetails"

import type {SliceState, ColoredTagType} from "@/types"
import type {RootState} from "@/app/types"
import TagForm from "./TagForm"
import EditButton from "./EditButton"
import {DeleteTagButton} from "./DeleteButton"

export default function TagDetailsComponent() {
  const {data} = useSelector<RootState>(
    selectTagDetails
  ) as SliceState<ColoredTagType>

  if (data == null) {
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
  return (
    <Breadcrumbs>
      <Link to="/tags/">Tags</Link>
      <Link to={`/tags/${tag?.id}`}>{tag?.name}</Link>
    </Breadcrumbs>
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
