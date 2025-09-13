import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetRoleQuery} from "@/features/roles/storage/api"
import {selectRoleDetailsID} from "@/features/roles/storage/role"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {server2clientPerms} from "@/features/roles/utils"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
import {Breadcrumbs, Group, Loader, Paper, Stack} from "@mantine/core"
import {RoleForm} from "kommon"
import {Link, useNavigation} from "react-router-dom"
import {DeleteRoleButton} from "./DeleteButton"
import EditButton from "./EditButton"

import type {RoleDetails} from "@/types"

export default function RoleDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const roleID = useAppSelector(s => selectRoleDetailsID(s, mode))
  const {data, isLoading, error} = useGetRoleQuery(roleID || "", {
    skip: !roleID
  })

  if (isLoading) return <div>Loading...</div>

  if (error) return <div>Error loading role</div>

  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <Paper p="md" withBorder style={{height: "100%"}}>
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path role={data} mode={mode} />
          <Group>
            <DeleteRoleButton roleId={data.id} />
            <EditButton roleId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>

        <RoleForm
          key={`${data.id}-${data?.scopes?.join(",")}`}
          initialCheckedState={server2clientPerms(data.scopes)}
          name={data.name}
          isLoading={false}
          readOnly={true}
        />
      </Stack>
    </Paper>
  )
}

function Path({role, mode}: {role: RoleDetails | null; mode: PanelMode}) {
  const navigation = useNavigation()

  if (mode == "main") {
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

  return (
    <Group>
      <Breadcrumbs>
        <div>Roles</div>
        <div>{role?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
