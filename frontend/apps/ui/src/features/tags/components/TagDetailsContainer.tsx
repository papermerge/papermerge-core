import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {useGetTagQuery} from "@/features/tags/storage/api"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetails} from "@/features/ui/panelRegistry"
import type {PanelMode} from "@/types"
import type {TagDetails} from "@/types.d/tags"
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
import {DeleteTagButton} from "./DeleteButton"
import EditButton from "./EditButton"
import TagForm from "./TagForm"

import LoadingPanel from "@/components/LoadingPanel"
import {useTranslation} from "react-i18next"

export default function TagDetailsContainer() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const tagID = useAppSelector(s => selectPanelDetails(s, panelId))
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)
  const {data, isLoading, isFetching, error} = useGetTagQuery(
    tagID?.entityId || "",
    {
      skip: !tagID
    }
  )

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading tag details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path tag={data} panelId={panelId} />
          <Group>
            <DeleteTagButton tagId={data.id} />
            <EditButton tagId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <TagForm key={data.id} tag={data} />

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

function Path({tag, panelId}: {tag: TagDetails | null; panelId: PanelMode}) {
  const navigation = useNavigation()

  if (panelId == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/tags/">Tags</Link>
          <Link to={`/tags/${tag?.id}`}>{tag?.name}</Link>
        </Breadcrumbs>
        {navigation.state == "loading" && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>Tags</div>
        <div>{tag?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
