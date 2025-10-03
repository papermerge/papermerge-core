import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {useGetUserQuery} from "@/features/users/storage/api"
import {selectUserDetailsID} from "@/features/users/storage/user"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
import {formatTimestamp} from "@/utils/formatTimestamp"
import {
  Breadcrumbs,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  Stack
} from "@mantine/core"
import {CopyableTextInput} from "kommon"
import {Link, useNavigation} from "react-router-dom"
import {DeleteUserButton} from "./DeleteButton"
import EditButton from "./EditButton"
import UserForm from "./UserForm"

import LoadingPanel from "@/components/LoadingPanel"
import ChangePasswordButton from "@/features/users/components/ChangePasswordButton"
import type {UserDetails} from "@/types"
import {useTranslation} from "react-i18next"

export default function UserDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const userID = useAppSelector(s => selectUserDetailsID(s, mode))
  const {data, isLoading, isFetching, error} = useGetUserQuery(userID || "", {
    skip: !userID
  })
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading user details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path user={data} mode={mode} />
          <Group>
            <DeleteUserButton userId={data.id} />
            <ChangePasswordButton userId={data.id} />
            <EditButton userId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <UserForm key={`${data.id}-${data?.scopes?.join(",")}`} user={data} />

          <CopyableTextInput
            value={data.home_folder_id}
            label={t?.("user.HomeFolderID", {defaultValue: "Home Folder ID"})}
          />
          <CopyableTextInput
            value={data.inbox_folder_id}
            label={t?.("user.InboxFolderID", {defaultValue: "Inbox Folder ID"})}
          />

          <CopyableTextInput
            value={formatTimestamp(data.updated_at, timestamp_format, timezone)}
            label={t?.("updated_at", {defaultValue: "Updated at"})}
          />
          <CopyableTextInput
            value={data.updated_by?.username}
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
        </Stack>
      </Stack>
    </Paper>
  )
}

function Path({user, mode}: {user: UserDetails | null; mode: PanelMode}) {
  const navigation = useNavigation()

  if (mode == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/users/">Users</Link>
          <Link to={`/users/${user?.id}`}>{user?.username}</Link>
        </Breadcrumbs>
        {navigation.state == "loading" && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>Users</div>
        <div>{user?.username}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
