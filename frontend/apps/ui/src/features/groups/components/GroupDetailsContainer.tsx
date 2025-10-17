import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetGroupQuery} from "@/features/groups/storage/api"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetailsEntityId} from "@/features/ui/panelRegistry"
import type {GroupDetails} from "@/types.d/groups"
import {formatTimestamp} from "@/utils/formatTime"
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
import {DeleteGroupButton} from "./DeleteButton"
import EditButton from "./EditButton"
import GroupForm from "./GroupForm"

import LoadingPanel from "@/components/LoadingPanel"
import {PanelMode} from "@/types"
import {useTranslation} from "react-i18next"

export default function GroupDetailsContainer() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const groupID = useAppSelector(s => selectPanelDetailsEntityId(s, panelId))
  const {data, isLoading, isFetching, error} = useGetGroupQuery(groupID || "", {
    skip: !groupID
  })
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading group details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path group={data} panelId={panelId} />
          <Group>
            <DeleteGroupButton groupId={data.id} />
            <EditButton groupId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <GroupForm key={data.id} group={data} />

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

function Path({
  group,
  panelId
}: {
  group: GroupDetails | null
  panelId: PanelMode
}) {
  const navigation = useNavigation()

  if (panelId == "main") {
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

  return (
    <Group>
      <Breadcrumbs>
        <div>Groups</div>
        <div>{group?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
