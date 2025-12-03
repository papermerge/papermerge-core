import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetDocumentTypeQuery} from "@/features/document-types/storage/api"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetails} from "@/features/ui/panelRegistry"
import type {PanelMode} from "@/types"
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
import {DeleteDocumentTypeButton} from "./DeleteButton"
import DocumentTypeForm from "./DocumentTypeForm"
import EditButton from "./EditButton"

import LoadingPanel from "@/components/LoadingPanel"
import {DOCUMENT_TYPE_DELETE, DOCUMENT_TYPE_UPDATE} from "@/scopes"
import {useTranslation} from "react-i18next"
import {DocumentTypeDetails} from "../types"

export default function DocumentTypeDetailsContainer() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const {hasPermission} = useAuth()
  const documentTypeID = useAppSelector(s => selectPanelDetails(s, panelId))
  const {data, isLoading, isFetching, error} = useGetDocumentTypeQuery(
    documentTypeID?.entityId || "",
    {
      skip: !documentTypeID
    }
  )
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading documentType details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path documentType={data} panelId={panelId} />
          <Group>
            {hasPermission(DOCUMENT_TYPE_DELETE) && (
              <DeleteDocumentTypeButton documentTypeId={data.id} />
            )}
            {hasPermission(DOCUMENT_TYPE_UPDATE) && (
              <EditButton documentTypeId={data.id} />
            )}
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <DocumentTypeForm key={data.id} documentType={data} />

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
            value={data.created_by?.username}
            label={t?.("created_by", {defaultValue: "Created by"})}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

function Path({
  documentType,
  panelId
}: {
  documentType: DocumentTypeDetails | null
  panelId: PanelMode
}) {
  const navigation = useNavigation()

  if (panelId == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/categories/">DocumentTypes</Link>
          <Link to={`/categories/${documentType?.id}`}>
            {documentType?.name}
          </Link>
        </Breadcrumbs>
        {navigation.state == "loading" && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>DocumentTypes</div>
        <div>{documentType?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
