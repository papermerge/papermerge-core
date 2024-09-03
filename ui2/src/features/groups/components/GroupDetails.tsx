import {Link, useNavigation} from "react-router-dom"
import {Breadcrumbs, Box, LoadingOverlay, Group, Loader} from "@mantine/core"

import {useGetGroupQuery} from "@/features/groups/apiSlice"
import type {GroupDetails} from "@/types"
import GroupForm from "./GroupForm"
import EditButton from "./EditButton"
import {DeleteGroupButton} from "./DeleteButton"

interface GroupDetailsArgs {
  groupId: string
}

export default function GroupDetailsComponent({groupId}: GroupDetailsArgs) {
  const {data, isLoading} = useGetGroupQuery(groupId)

  if (isLoading || !data) {
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
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/groups/">Groups</Link>
        <Link to={`/groups/${group?.id}`}>{group?.name}</Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton groupId={modelId!} />
      <DeleteGroupButton groupId={modelId!} />
    </Group>
  )
}
