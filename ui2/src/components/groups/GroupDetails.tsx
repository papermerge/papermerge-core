import {useSelector} from "react-redux"
import {Link} from "react-router-dom"
import {Breadcrumbs, Box, LoadingOverlay, Group} from "@mantine/core"

import {selectGroupDetails} from "@/slices/groupDetails"

import type {GroupDetails, SliceState} from "@/types"
import type {RootState} from "@/app/types"
import GroupForm from "./GroupForm"
import EditButton from "./EditButton"
import DeleteButton from "./DeleteButton"

export default function GroupDetailsComponent() {
  const {data} = useSelector<RootState>(
    selectGroupDetails
  ) as SliceState<GroupDetails>

  if (data == null) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path group={null} />
        <GroupForm group={null} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path group={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <GroupForm group={data} />
    </>
  )
}

function Path({group}: {group: GroupDetails | null}) {
  return (
    <Breadcrumbs>
      <Link to="/groups/">Groups</Link>
      <Link to={`/groups/${group?.id}`}>{group?.name}</Link>
    </Breadcrumbs>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton groupId={modelId} />
      <DeleteButton />
    </Group>
  )
}
