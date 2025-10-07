import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import useI18NText from "@/features/roles/hooks/useRoleFormI18NText"
import {useGetRoleQuery} from "@/features/roles/storage/api"
import {
  selectRoleDetailsID,
  selectRoleFormExpandedNodes,
  setRoleFormExpandedNodes
} from "@/features/roles/storage/role"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {server2clientPerms} from "@/features/roles/utils"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
import {formatTimestamp} from "@/utils/formatTime"
import {
  Breadcrumbs,
  Group,
  List,
  Loader,
  LoadingOverlay,
  Paper,
  Stack,
  Text
} from "@mantine/core"
import {CopyableTextInput, RoleForm} from "kommon"
import {useCallback} from "react"
import {Link, useNavigation} from "react-router-dom"
import {DeleteRoleButton} from "./DeleteButton"
import EditButton from "./EditButton"

import LoadingPanel from "@/components/LoadingPanel"
import type {RoleDetails} from "@/types"
import {TFunction} from "i18next"
import {useTranslation} from "react-i18next"

export default function RoleDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const roleID = useAppSelector(s => selectRoleDetailsID(s, mode))
  const {data, isLoading, isFetching, error} = useGetRoleQuery(roleID || "", {
    skip: !roleID
  })
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)
  const expandedNodes = useAppSelector(s =>
    selectRoleFormExpandedNodes(s, mode)
  )
  const txt = useI18NText()

  const handleExpandedStateChange = useCallback(
    (expandedNodes: string[]) => {
      dispatch(
        setRoleFormExpandedNodes({
          mode,
          expandedNodes
        })
      )
    },
    [dispatch, mode]
  )

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading role</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
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
        <Stack style={{overflowY: "auto"}}>
          <RoleForm
            key={`${data.id}-${data?.scopes?.join(",")}`}
            initialCheckedState={server2clientPerms(data.scopes)}
            name={data.name}
            isLoading={false}
            readOnly={true}
            txt={txt?.roleForm}
            initialExpandedState={expandedNodes}
            onExpandedStateChange={handleExpandedStateChange}
          />
          <CopyableTextInput
            value={formatTimestamp(data.updated_at, timestamp_format, timezone)}
            label={t?.("updated_at", {defaultValue: "Updated at"})}
          />
          <CopyableTextInput
            value={data.updated_by.username}
            label={t?.("updated_by", {defaultValue: "Updated by"})}
          />
          <CopyableTextInput
            value={formatTimestamp(data.created_at, timestamp_format, timezone)}
            label={t?.("created_at", {defaultValue: "Created at"})}
          />
          <CopyableTextInput
            value={data.created_by.username}
            label={t?.("created_by", {defaultValue: "Created by"})}
          />
          <UsedBy users={data?.used_by} />
        </Stack>
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

interface UsedByArgs {
  users: {
    id: string
    username: string
  }[]
  t?: TFunction
}

function UsedBy({users, t}: UsedByArgs) {
  const userList = users.map(u => (
    <List.Item>
      <Link to={`/users/${u.id}`}>{u.username}</Link>
    </List.Item>
  ))

  return (
    <List>
      <Text>{t?.("usedBy") || "Used By"}:</Text>
      {userList}
    </List>
  )
}
