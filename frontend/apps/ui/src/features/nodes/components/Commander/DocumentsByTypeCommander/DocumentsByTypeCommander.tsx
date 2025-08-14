import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocsByTypeQuery} from "@/features/document/store/apiSlice"
import {useDynamicHeight} from "@/features/nodes/hooks/useDynamicHeight"
import {
  commanderLastPageSizeUpdated,
  documentsByTypeCommanderColumnsUpdated,
  selectCommanderDocumentTypeID,
  selectDocumentsByTypeCommanderVisibleColumns,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {
  Box,
  Center,
  Checkbox,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  UnstyledButton,
  rem
} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {IconChevronDown, IconChevronUp, IconSelector} from "@tabler/icons-react"
import {useContext, useEffect, useRef, useState} from "react"
import classes from "./TableSort.module.css"

import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"
import DocumentRow from "./DocumentRow"

export default function DocumentsByCategoryCommander() {
  const {t} = useTranslation()
  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [reverseOrderDirection, setReverseOrderDirection] = useState(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const visibleColumns = useAppSelector(s =>
    selectDocumentsByTypeCommanderVisibleColumns(s, mode)
  )
  const topActionsRef = useRef<HTMLDivElement>(null) // ActionButtons
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null) // Table.Thead
  const paginationRef = useRef<HTMLDivElement>(null) // Pagination

  const remainingHeight = useDynamicHeight([
    topActionsRef,
    tableHeaderRef,
    paginationRef
  ])

  const currentDocumentTypeID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, mode)
  )
  const {data} = useGetDocsByTypeQuery(
    currentDocumentTypeID
      ? {
          document_type_id: currentDocumentTypeID,
          page_number: page,
          page_size: pageSize,
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

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pSize = parseInt(value)
      setPageSize(pSize)
      // reset current page
      setPage(1)
      // remember last page size
      dispatch(commanderLastPageSizeUpdated({pageSize: pSize, mode}))
    }
  }

  useEffect(() => {
    if (data && data?.items.length > 0 && currentDocumentTypeID) {
      dispatch(
        documentsByTypeCommanderColumnsUpdated({
          mode: mode,
          document_type_id: currentDocumentTypeID,
          columns: data.items[0].custom_fields.map(cf => cf[0])
        })
      )
    }
  }, [data?.items.length, currentDocumentTypeID, mode])

  if (!data || (data && data.items.length == 0)) {
    return (
      <Box>
        <Stack>
          <ActionButtons />
        </Stack>
        <Stack>{t("common.empty")}</Stack>
      </Box>
    )
  }

  const rows = data.items.map(n => <DocumentRow key={n.id} doc={n} />)
  const visibleCustomFields = data.items[0].custom_fields.filter(cf =>
    visibleColumns.includes(cf[0])
  )
  const customFieldsHeaderColumns = visibleCustomFields.map(cf => (
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
      <Stack ref={topActionsRef}>
        <ActionButtons />
      </Stack>
      <Stack>
        <ScrollArea mt={"md"} h={remainingHeight} type="auto">
          <Table layout="fixed" stickyHeader>
            <Table.Thead ref={tableHeaderRef}>
              <Table.Tr>
                <Table.Th style={{width: 50}}>
                  <Checkbox />
                </Table.Th>
                <Table.Th>Title</Table.Th>
                {customFieldsHeaderColumns}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
        <Box ref={paginationRef}>
          <Pagination
            pagination={{
              pageNumber: page,
              pageSize: pageSize,
              numPages: data.num_pages
            }}
            onPageNumberChange={onPageNumberChange}
            onPageSizeChange={onPageSizeChange}
            lastPageSize={lastPageSize}
          />
        </Box>
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
