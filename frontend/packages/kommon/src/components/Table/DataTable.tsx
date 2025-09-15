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
import LeadColumnBody from "./LeadColumnBody"
import LeadColumnHeader from "./LeadColumnHeader"
import {ColumnConfig, SortState} from "./types"

interface Args<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sorting: SortState
  onSortChange?: (sort: SortState) => void
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T, otherPanel: boolean) => void
  //the ID of the row to highlight
  highlightRowID?: string
  // Checkbox functionality
  withCheckbox?: boolean
  selectedRows?: Set<string>
  onSelectionChange?: (selectedRows: Set<string>) => void
  getRowId?: (row: T) => string
}

export default function DataTable<T>({
  data,
  columns,
  sorting,
  onSortChange,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  highlightRowID,
  withCheckbox = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowId = (row: T) => String((row as any).id)
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

    onSortChange?.({
      column: newDirection ? columnKey : null,
      direction: newDirection
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const allIds = new Set(data.map(getRowId))
      onSelectionChange(allIds)
    } else {
      onSelectionChange(new Set())
    }
  }

  const handleRowSelect = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = new Set(selectedRows)
    if (checked) {
      newSelection.add(rowId)
    } else {
      newSelection.delete(rowId)
    }
    onSelectionChange(newSelection)
  }

  const isAllSelected = data.length > 0 && selectedRows.size === data.length
  const isIndeterminate =
    selectedRows.size > 0 && selectedRows.size < data.length

  if (loading && data.length === 0) {
    return (
      <LoadingTable
        visibleColumns={visibleColumns}
        loading={loading}
        withCheckbox={withCheckbox}
      />
    )
  }

  return (
    <Box
      style={{
        height: "100%",
        overflow: "hidden",
        overflowX: "auto",
        overflowY: "hidden"
      }}
    >
      <LoadingOverlay visible={loading} />
      <Table
        striped
        highlightOnHover
        withTableBorder
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          width: "max-content",
          minWidth: "100%"
        }}
      >
        <TableHeader
          visibleColumns={visibleColumns}
          sorting={sorting}
          handleSort={handleSort}
          withCheckbox={withCheckbox}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          onSelectAll={handleSelectAll}
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
          withCheckbox={withCheckbox}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          getRowId={getRowId}
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
  withCheckbox?: boolean
}

const EmptyTableBody = function EmptyTableBody({
  message,
  visibleColumnsCount,
  withCheckbox = false
}: EmptyRowArgs) {
  const colSpan = withCheckbox ? visibleColumnsCount + 1 : visibleColumnsCount

  return (
    <Table.Tr>
      <Table.Td
        colSpan={colSpan}
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
  withCheckbox?: boolean
  selectedRows?: Set<string>
  onRowSelect?: (rowId: string, checked: boolean) => void
  getRowId?: (row: T) => string
}

const TableRow = <T,>({
  row,
  visibleColumns,
  onRowClick,
  highlightRowID,
  highlightColors,
  withCheckbox = false,
  selectedRows = new Set(),
  onRowSelect,
  getRowId = (row: T) => String((row as any).id)
}: RowArgs<T>) => {
  const highlighted = isRowHighlighted(row, highlightRowID)
  const rowId = getRowId(row)
  const isSelected = selectedRows.has(rowId)

  const rowStyle = {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
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

  return (
    <Table.Tr style={rowStyle}>
      <LeadColumnBody
        rowId={rowId}
        isSelected={isSelected}
        row={row}
        withCheckbox={withCheckbox}
        onRowClick={onRowClick}
        onRowSelect={onRowSelect}
      />
      {renderedColumns}
    </Table.Tr>
  )
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
  withCheckbox?: boolean
  selectedRows?: Set<string>
  onRowSelect?: (rowId: string, checked: boolean) => void
  getRowId?: (row: T) => string
}

function TableBody<T>({
  data,
  emptyMessage,
  highlightRowID,
  visibleColumns,
  onRowClick,
  highlightColors,
  withCheckbox = false,
  selectedRows = new Set(),
  onRowSelect,
  getRowId = (row: T) => String((row as any).id)
}: TBodyArgs<T>) {
  if (data.length === 0) {
    return (
      <Table.Tbody>
        <EmptyTableBody
          message={emptyMessage}
          visibleColumnsCount={visibleColumns.length}
          withCheckbox={withCheckbox}
        />
      </Table.Tbody>
    )
  }

  const rows = data.map(row => (
    <TableRow
      key={getRowId(row)}
      visibleColumns={visibleColumns}
      row={row}
      highlightRowID={highlightRowID}
      onRowClick={onRowClick}
      highlightColors={highlightColors}
      withCheckbox={withCheckbox}
      selectedRows={selectedRows}
      onRowSelect={onRowSelect}
      getRowId={getRowId}
    />
  ))

  return (
    <Table.Tbody
      className="scrollable-xy"
      style={{height: "100%", display: "flex", flexDirection: "column"}}
    >
      {rows}
    </Table.Tbody>
  )
}

interface LoadingTableArgs<T> {
  visibleColumns: ColumnConfig<T>[]
  loading: boolean
  withCheckbox?: boolean
}

const LoadingTable = <T,>({
  visibleColumns,
  loading,
  withCheckbox = false
}: LoadingTableArgs<T>) => {
  const headerColumns = visibleColumns.map(column => (
    <Table.Th key={String(column.key)}>
      <Skeleton height={20} />
    </Table.Th>
  ))

  const bodyColumns = Array.from({length: 5}).map((_, index) => (
    <Table.Tr
      key={index}
      style={{display: "flex", width: "100%", justifyContent: "space-between"}}
    >
      {withCheckbox && (
        <Table.Td>
          <Skeleton height={16} width={16} />
        </Table.Td>
      )}
      {visibleColumns.map(column => (
        <Table.Td key={String(column.key)}>
          <Skeleton height={16} />
        </Table.Td>
      ))}
    </Table.Tr>
  ))

  return (
    <Box>
      <LoadingOverlay visible={loading} />
      <Table>
        <Table.Thead>
          <Table.Tr
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between"
            }}
          >
            {withCheckbox && (
              <Table.Th style={{width: 40, minWidth: 40}}>
                <Skeleton height={20} width={16} />
              </Table.Th>
            )}
            {headerColumns}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody className="scrollable-xy">{bodyColumns}</Table.Tbody>
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
  withCheckbox?: boolean
  isAllSelected?: boolean
  isIndeterminate?: boolean
  onSelectAll?: (checked: boolean) => void
}

const TableHeader = function TableHeader<T>({
  visibleColumns,
  sorting,
  handleSort,
  withCheckbox = false,
  isAllSelected = false,
  isIndeterminate = false,
  onSelectAll
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
      <Table.Tr
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between"
        }}
      >
        <LeadColumnHeader
          withCheckbox={withCheckbox}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          onSelectAll={onSelectAll}
        />

        {columns}
      </Table.Tr>
    </Table.Thead>
  )
}
