import type {MantineColorScheme, MantineTheme} from "@mantine/core"
import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Skeleton,
  Table,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core"
import {IconChevronDown, IconChevronUp, IconSelector} from "@tabler/icons-react"
import React from "react"
import {ColumnConfig, SortState} from "./types"

interface Args<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sorting: SortState
  onSortChange: (sort: SortState) => void
  loading?: boolean
  emptyMessage?: string
  style?: React.CSSProperties
  onRowClick?: (row: T, otherPanel: boolean) => void
  //the ID of the row to highlight
  highlightRowID?: string
}

export default function DataTable<T>({
  data,
  columns,
  sorting,
  onSortChange,
  loading = false,
  emptyMessage = "No data available",
  style,
  onRowClick,
  highlightRowID
}: Args<T>) {
  const theme = useMantineTheme()
  const {colorScheme} = useMantineColorScheme()

  const visibleColumns = columns.filter(col => col.visible !== false)

  const highlightColors = {
    backgroundColor:
      colorScheme === "dark" ? theme.colors.blue[9] : theme.colors.blue[1],
    borderColor: theme.colors.blue[6]
  }

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    let newDirection: "asc" | "desc" | null = "asc"

    if (sorting.column === columnKey) {
      if (sorting.direction === "asc") {
        newDirection = "desc"
      } else if (sorting.direction === "desc") {
        newDirection = "asc"
      }
    }

    onSortChange({
      column: newDirection ? columnKey : null,
      direction: newDirection
    })
  }

  if (loading && data.length === 0) {
    return <LoadingTable visibleColumns={visibleColumns} loading={loading} />
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Table striped highlightOnHover withTableBorder style={style}>
        <TableHeader
          visibleColumns={visibleColumns}
          sorting={sorting}
          handleSort={handleSort}
        />

        <TableBody
          data={data}
          emptyMessage={emptyMessage}
          visibleColumns={visibleColumns}
          highlightRowID={highlightRowID}
          onRowClick={onRowClick}
          theme={theme}
          colorScheme={colorScheme}
          highlightColors={highlightColors}
        />
      </Table>
    </Box>
  )
}

interface CellArgs {
  width: number
  minWidth: number
  maxWidth?: number
  value: React.ReactNode
}

const TableCell = function TableCell({
  width,
  minWidth,
  maxWidth,
  value
}: CellArgs) {
  const style = {
    width,
    minWidth: minWidth,
    maxWidth: maxWidth,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const
  }

  return <Table.Td style={style}>{value}</Table.Td>
}

interface EmptyRowArgs {
  message: string
  visibleColumnsCount: number
}

const EmptyTableBody = function EmptyTableBody({
  message,
  visibleColumnsCount
}: EmptyRowArgs) {
  return (
    <Table.Tr>
      <Table.Td
        colSpan={visibleColumnsCount}
        style={{textAlign: "center", padding: "3rem"}}
      >
        <Text c="dimmed">{message}</Text>
      </Table.Td>
    </Table.Tr>
  )
}

function isRowHighlighted<T>(row: T, highlightRowID?: string): boolean {
  if (!highlightRowID) {
    return false
  }

  return String((row as any).id) === highlightRowID
}

interface RowArgs<T> {
  highlightRowID?: string
  row: T
  visibleColumns: ColumnConfig<T>[]
  onRowClick?: (row: T, otherPanel: boolean) => void
  highlightColors: {backgroundColor: string; borderColor: string}
}

const TableRow = <T,>({
  row,
  visibleColumns,
  onRowClick,
  highlightRowID,
  highlightColors
}: RowArgs<T>) => {
  const highlighted = isRowHighlighted(row, highlightRowID)

  const rowStyle = {
    backgroundColor: highlighted ? highlightColors.backgroundColor : undefined,
    borderLeft: highlighted
      ? `3px solid ${highlightColors.borderColor}`
      : undefined
  }

  const renderedColumns = visibleColumns.map(column => {
    const value = row[column.key]
    const renderedValue = column.render
      ? (() => {
          const start = performance.now()
          const result = column.render(value, row, onRowClick)
          const end = performance.now()
          if (end - start > 1) {
            console.log(
              `Slow render for column ${String(column.key)}: ${end - start}ms`
            )
          }
          return result
        })()
      : String(value)

    return (
      <TableCell
        key={String(column.key)}
        width={column.width || 50}
        value={renderedValue}
        minWidth={column.minWidth || 50}
        maxWidth={column.maxWidth}
      />
    )
  })

  return <Table.Tr style={rowStyle}>{renderedColumns}</Table.Tr>
}

interface TBodyArgs<T> {
  data: T[]
  emptyMessage: string
  highlightRowID?: string
  visibleColumns: ColumnConfig<T>[]
  onRowClick?: (row: T, otherPanel: boolean) => void
  theme: MantineTheme
  colorScheme: MantineColorScheme
  highlightColors: {backgroundColor: string; borderColor: string}
}

function TableBody<T>({
  data,
  emptyMessage,
  highlightRowID,
  visibleColumns,
  onRowClick,
  highlightColors
}: TBodyArgs<T>) {
  if (data.length === 0) {
    return (
      <Table.Tbody>
        <EmptyTableBody
          message={emptyMessage}
          visibleColumnsCount={visibleColumns.length}
        />
      </Table.Tbody>
    )
  }

  const rows = data.map(row => (
    <TableRow
      key={(row as any).id || JSON.stringify(row)}
      visibleColumns={visibleColumns}
      row={row}
      highlightRowID={highlightRowID}
      onRowClick={onRowClick}
      highlightColors={highlightColors}
    />
  ))

  return <Table.Tbody>{rows}</Table.Tbody>
}

interface LoadingTableArgs<T> {
  visibleColumns: ColumnConfig<T>[]
  loading: boolean
}

const LoadingTable = <T,>({visibleColumns, loading}: LoadingTableArgs<T>) => {
  const headerColumns = visibleColumns.map(column => (
    <Table.Th key={String(column.key)}>
      <Skeleton height={20} />
    </Table.Th>
  ))

  const bodyColumns = Array.from({length: 5}).map((_, index) => (
    <Table.Tr key={index}>
      {visibleColumns.map(column => (
        <Table.Td key={String(column.key)}>
          <Skeleton height={16} />
        </Table.Td>
      ))}
    </Table.Tr>
  ))

  return (
    <Box pos="relative" mih={400}>
      <LoadingOverlay visible={loading} />
      <Table>
        <Table.Thead>
          <Table.Tr>{headerColumns}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>{bodyColumns}</Table.Tbody>
      </Table>
    </Box>
  )
}

interface TableThArgs<T> {
  column: ColumnConfig<T>
  sorting: SortState
  handleSort: (columnKey: string) => void
}

const TableTh = function TableTh<T>({
  column,
  sorting,
  handleSort
}: TableThArgs<T>) {
  const getSortIcon = (columnKey: string) => {
    if (sorting.column !== columnKey) {
      return <IconSelector size={14} />
    }
    return sorting.direction === "asc" ? (
      <IconChevronUp size={14} />
    ) : (
      <IconChevronDown size={14} />
    )
  }

  const handleClick = () => {
    if (column.sortable) {
      handleSort(String(column.key))
    }
  }

  const thStyle = {
    width: column.width,
    minWidth: column.minWidth || 50,
    maxWidth: column.maxWidth,
    position: "relative" as const,
    userSelect: "none" as const
  }

  const groupStyle = {
    cursor: column.sortable ? "pointer" : "default",
    flex: 1
  }

  return (
    <Table.Th style={thStyle}>
      <Group gap="xs" wrap="nowrap" justify="space-between">
        <Group gap="xs" style={groupStyle} onClick={handleClick}>
          <Text size="sm" fw={500}>
            {column.label}
          </Text>
          {column.sortable && (
            <ActionIcon variant="subtle" color="gray" size="xs">
              {getSortIcon(String(column.key))}
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Table.Th>
  )
}

interface TableHeaderArgs<T> {
  visibleColumns: ColumnConfig<T>[]
  sorting: SortState
  handleSort: (columnKey: string) => void
}

const TableHeader = function TableHeader<T>({
  visibleColumns,
  sorting,
  handleSort
}: TableHeaderArgs<T>) {
  const columns = visibleColumns.map(column => (
    <TableTh
      key={String(column.key)}
      column={column}
      sorting={sorting}
      handleSort={handleSort}
    />
  ))

  return (
    <Table.Thead>
      <Table.Tr>{columns}</Table.Tr>
    </Table.Thead>
  )
}
