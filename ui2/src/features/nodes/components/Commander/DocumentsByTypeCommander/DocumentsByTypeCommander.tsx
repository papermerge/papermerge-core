import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocsByTypeQuery} from "@/features/document/apiSlice"
import {selectCommanderDocumentTypeID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Box, Checkbox, Stack, Table} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {useContext, useState} from "react"

import {Center, Group, Text, UnstyledButton, rem} from "@mantine/core"
import {IconChevronDown, IconChevronUp, IconSelector} from "@tabler/icons-react"
import classes from "./TableSort.module.css"

import ActionButtons from "./ActionButtons"
import DocumentRow from "./DocumentRow"

export default function DocumentsByCategoryCommander() {
  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [reverseOrderDirection, setReverseOrderDirection] = useState(false)
  const mode: PanelMode = useContext(PanelContext)

  const currentDocumentTypeID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, mode)
  )
  const {data: nodes} = useGetDocsByTypeQuery(
    currentDocumentTypeID
      ? {
          document_type_id: currentDocumentTypeID,
          order_by: orderBy,
          order: reverseOrderDirection ? "asc" : "desc"
        }
      : skipToken
  )

  const setSorting = (field: string) => {
    const reversed = field === orderBy ? !reverseOrderDirection : false
    setReverseOrderDirection(reversed)
    setOrderBy(field)
  }

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
    <Th
      sorted={orderBy === cf[0]}
      reversed={reverseOrderDirection}
      onSort={() => setSorting(cf[0])}
      key={cf[0]}
    >
      {cf[0]}
    </Th>
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

interface ThProps {
  children: React.ReactNode
  reversed: boolean
  sorted: boolean
  onSort(): void
}

function Th({children, reversed, sorted, onSort}: ThProps) {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector

  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon style={{width: rem(16), height: rem(16)}} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
