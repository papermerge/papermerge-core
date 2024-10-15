import {useAppSelector} from "@/app/hooks"
import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocsByTypeQuery} from "@/features/document/apiSlice"
import {useGetFolderQuery} from "@/features/nodes/apiSlice"
import {
  selectCommanderDocumentTypeID,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import type {NType, PanelMode} from "@/types"
import {Box, Checkbox, Stack, Table} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {useContext} from "react"
import ActionButtons from "./ActionButtons"
import DocumentRow from "./DocumentRow"

export default function DocumentsByCategoryCommander() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const currentDocumentTypeID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, mode)
  )
  const {data: currentFolder} = useGetFolderQuery(currentNodeID ?? skipToken)
  const {data: nodes} = useGetDocsByTypeQuery(
    currentNodeID && currentDocumentTypeID
      ? {document_type_id: currentDocumentTypeID, ancestor_id: currentNodeID}
      : skipToken
  )

  const onClick = (node: NType) => {}

  if (!nodes || (nodes && nodes.length == 0)) {
    return (
      <Box>
        <Stack>
          <ActionButtons />
          <Breadcrumbs
            breadcrumb={currentFolder?.breadcrumb}
            onClick={onClick}
            isFetching={false}
          />
        </Stack>
        <Stack>Empty</Stack>
      </Box>
    )
  }

  const rows = nodes.map(n => <DocumentRow key={n.id} doc={n} />)
  const customFieldsHeaderColumns = nodes[0].custom_fields.map(cf => (
    <Table.Th key={cf[0]}>{cf[0]}</Table.Th>
  ))

  return (
    <Box>
      <Stack>
        <ActionButtons />
        <Breadcrumbs
          breadcrumb={currentFolder?.breadcrumb}
          onClick={onClick}
          isFetching={false}
        />
      </Stack>
      <Stack>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox />
              </Table.Th>
              <Table.Th>Title</Table.Th>
              {customFieldsHeaderColumns}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Stack>
    </Box>
  )
}
