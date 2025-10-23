import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetCustomFieldQuery} from "@/features/custom-fields/storage/api"
import {selectPanelDetails} from "@/features/ui/panelRegistry"

import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import type {PanelMode} from "@/types"
import type {CustomFieldDetails} from "@/types.d/customFields"
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
import CustomFieldForm from "./CustomFieldForm"
import {DeleteCustomFieldButton} from "./DeleteButton"
import EditButton from "./EditButton"
import {useAuth} from "@/app/hooks/useAuth"

import LoadingPanel from "@/components/LoadingPanel"
import {useTranslation} from "react-i18next"
import {CUSTOM_FIELD_DELETE, CUSTOM_FIELD_UPDATE} from "@/scopes"

export default function CustomFieldDetailsContainer() {
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const customFieldID = useAppSelector(s => selectPanelDetails(s, panelId))
  const {data, isLoading, isFetching, error} = useGetCustomFieldQuery(
    customFieldID?.entityId || "",
    {
      skip: !customFieldID
    }
  )
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading customField details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path customField={data} panelId={panelId} />
          <Group>
            {hasPermission(CUSTOM_FIELD_DELETE) && (
              <DeleteCustomFieldButton customFieldId={data.id} />
            )}
            {hasPermission(CUSTOM_FIELD_UPDATE) && (
              <EditButton customFieldId={data.id} />
            )}
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <CustomFieldForm key={data.id} customField={data} t={t} />

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
            value={data.created_by && data.created_by.username}
            label={t?.("created_by", {defaultValue: "Created by"})}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

function Path({
  customField,
  panelId
}: {
  customField: CustomFieldDetails | null
  panelId: PanelMode
}) {
  const navigation = useNavigation()
  const {t} = useTranslation()

  if (panelId == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/custom-fields/">
            {t("customFieldDetails.name", {defaultValue: "Custom Fields"})}
          </Link>
          <Link to={`/custom-fields/${customField?.id}`}>
            {customField?.name}
          </Link>
        </Breadcrumbs>
        {navigation.state == "loading" && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>
          {t("customFieldDetails.name", {defaultValue: "Custom Fields"})}
        </div>
        <div>{customField?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
