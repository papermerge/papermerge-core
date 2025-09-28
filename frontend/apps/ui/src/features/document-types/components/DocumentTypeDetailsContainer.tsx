import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetDocumentTypeQuery} from "@/features/document-types/storage/api"
import {selectDocumentTypeDetailsID} from "@/features/document-types/storage/documentType"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
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
import {useTranslation} from "react-i18next"
import {DocumentTypeDetails} from "../types"

export default function DocumentTypeDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const documentTypeID = useAppSelector(s =>
    selectDocumentTypeDetailsID(s, mode)
  )
  const {data, isLoading, isFetching, error} = useGetDocumentTypeQuery(
    documentTypeID || "",
    {
      skip: !documentTypeID
    }
  )

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
          <Path documentType={data} mode={mode} />
          <Group>
            <DeleteDocumentTypeButton documentTypeId={data.id} />
            <EditButton documentTypeId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <DocumentTypeForm key={data.id} documentType={data} />

          <CopyableTextInput
            value={data.updated_at}
            label={t?.("updated_at", {defaultValue: "Updated at"})}
          />
          <CopyableTextInput
            value={data.updated_by?.username}
            label={t?.("updated_by", {defaultValue: "Updated by"})}
          />
          <CopyableTextInput
            value={data.created_at}
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
  documentType,
  mode
}: {
  documentType: DocumentTypeDetails | null
  mode: PanelMode
}) {
  const navigation = useNavigation()

  if (mode == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/documentTypes/">DocumentTypes</Link>
          <Link to={`/documentTypes/${documentType?.id}`}>
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
