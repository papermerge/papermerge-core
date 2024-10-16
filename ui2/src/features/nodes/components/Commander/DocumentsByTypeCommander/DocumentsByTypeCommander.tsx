import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocsByTypeQuery} from "@/features/document/apiSlice"
import {selectCommanderDocumentTypeID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Box, Checkbox, Stack, Table} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {useContext} from "react"
import ActionButtons from "./ActionButtons"
import DocumentRow from "./DocumentRow"

export default function DocumentsByCategoryCommander() {
  const mode: PanelMode = useContext(PanelContext)
  const currentDocumentTypeID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, mode)
  )
  const {data: nodes} = useGetDocsByTypeQuery(
    currentDocumentTypeID ?? skipToken
  )

  if (!nodes || (nodes && nodes.length == 0)) {
    return (
      <Box>
        <Stack>
          <ActionButtons />
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
      </Stack>
      <Stack>
        <Table mt={"lg"}>
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
