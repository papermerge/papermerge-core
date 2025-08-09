import {Box, Breadcrumbs, Group, Loader, LoadingOverlay} from "@mantine/core"
import {Link, useNavigation} from "react-router-dom"

import {useGetRoleQuery} from "@/features/roles/apiSlice"
import type {RoleDetails} from "@/types"
import {DeleteRoleButton} from "./DeleteButton"
import EditButton from "./EditButton"
import {RoleForm} from "kommon"
import {server2clientPerms} from "@/features/roles/utils"

interface RoleDetailsArgs {
  roleId: string
}

export default function RoleDetailsComponent({roleId}: RoleDetailsArgs) {
  const {data, isLoading} = useGetRoleQuery(roleId)

  if (isLoading || !data) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path role={null} />
        <RoleForm isLoading={true} readOnly={true} initialCheckedState={[]} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path role={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <RoleForm
        key={`${data.id}-${data.scopes.join(",")}`}
        initialCheckedState={server2clientPerms(data.scopes)}
        name={data.name}
        isLoading={false}
        readOnly={true}
      />
    </>
  )
}

function Path({role}: {role: RoleDetails | null}) {
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/roles/">Roles</Link>
        <Link to={`/roles/${role?.id}`}>{role?.name}</Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton roleId={modelId!} />
      <DeleteRoleButton roleId={modelId!} />
    </Group>
  )
}
