import {Box, Breadcrumbs, Group, Loader, LoadingOverlay} from "@mantine/core"
import {Link, useNavigation} from "react-router-dom"

import {useGetDocumentTypeQuery} from "@/features/document-types/apiSlice"
import type {DocType} from "../types"
import {DeleteDocumentTypeButton} from "./DeleteButton"
import DocumentTypeForm from "./DocumentTypeForm"
import EditButton from "./EditButton"

interface CustomFieldDetailsArgs {
  documentTypeId: string
}

export default function CustomFieldDetailsComponent({
  documentTypeId
}: CustomFieldDetailsArgs) {
  const {data, isLoading} = useGetDocumentTypeQuery(documentTypeId)

  if (isLoading || !data) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path documentType={null} />
        <DocumentTypeForm documentType={null} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path documentType={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <DocumentTypeForm documentType={data} />
    </>
  )
}

function Path({documentType}: {documentType: DocType | null}) {
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/document-types/">Document Types</Link>
        <Link to={`/document-types/${documentType?.id}`}>
          {documentType?.name}
        </Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton documentTypeId={modelId!} />
      <DeleteDocumentTypeButton documentTypeId={modelId!} />
    </Group>
  )
}
