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
import React, {useCallback, useMemo} from "react"
import {ColumnConfig, SortState} from "./types"

interface Args<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sorting: SortState
  onSortChange: (sort: SortState) => void
  columnWidths: Record<string, number>
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
  columnWidths,
  loading = false,
  emptyMessage = "No data available",
  style,
  onRowClick,
  highlightRowID
}: Args<T>) {
  const theme = useMantineTheme()
  const {colorScheme} = useMantineColorScheme()

  // Memoize visibleColumns
  const visibleColumns = useMemo(
    () => columns.filter(col => col.visible !== false),
    [columns]
  )

  // Memoize highlight colors
  const highlightColors = useMemo(
    () => ({
      backgroundColor:
        colorScheme === "dark" ? theme.colors.blue[9] : theme.colors.blue[1],
      borderColor: theme.colors.blue[6]
    }),
    [colorScheme, theme]
  )

  // Memoize getColumnWidth function
  const getColumnWidth = useCallback(
    (column: ColumnConfig<T>) => {
      const customWidth = columnWidths[String(column.key)]
      if (customWidth) return customWidth
      if (column.width) return column.width
      return 150 // Default width
    },
    [columnWidths]
  )

  // Memoize handleSort function
  const handleSort = useCallback(
    (columnKey: string) => {
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
    },
    [columns, sorting, onSortChange]
  )

  if (loading && data.length === 0) {
    return <LoadingTable visibleColumns={visibleColumns} loading={loading} />
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Table striped highlightOnHover withTableBorder style={style}>
        <TableHeader
          visibleColumns={visibleColumns}
          columnWidths={columnWidths}
          sorting={sorting}
          handleSort={handleSort}
          getColumnWidth={getColumnWidth}
        />

        <TableBody
          data={data}
          emptyMessage={emptyMessage}
          visibleColumns={visibleColumns}
          highlightRowID={highlightRowID}
          onRowClick={onRowClick}
          columnWidths={columnWidths}
          theme={theme}
          colorScheme={colorScheme}
          highlightColors={highlightColors}
          getColumnWidth={getColumnWidth}
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

const TableCell = React.memo<CellArgs>(function TableCell({
  width,
  minWidth,
  maxWidth,
  value
}) {
  const style = useMemo(
    () => ({
      width,
      minWidth: minWidth,
      maxWidth: maxWidth,
      overflow: "hidden" as const,
      textOverflow: "ellipsis" as const,
      whiteSpace: "nowrap" as const
    }),
    [width, minWidth, maxWidth]
  )

  return <Table.Td style={style}>{value}</Table.Td>
})

interface EmptyRowArgs {
  message: string
  visibleColumnsCount: number
}

const EmptyTableBody = React.memo<EmptyRowArgs>(function EmptyTableBody({
  message,
  visibleColumnsCount
}) {
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
})

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
  getColumnWidth: (column: ColumnConfig<T>) => number
}

const TableRow = React.memo(
  <T,>({
    row,
    visibleColumns,
    onRowClick,
    highlightRowID,
    highlightColors,
    getColumnWidth
  }: RowArgs<T>) => {
    const highlighted = useMemo(
      () => isRowHighlighted(row, highlightRowID),
      [row, highlightRowID]
    )

    const rowStyle = useMemo(
      () => ({
        backgroundColor: highlighted
          ? highlightColors.backgroundColor
          : undefined,
        borderLeft: highlighted
          ? `3px solid ${highlightColors.borderColor}`
          : undefined
      }),
      [highlighted, highlightColors]
    )

    const renderedColumns = useMemo(
      () =>
        visibleColumns.map(column => {
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
              width={getColumnWidth(column)}
              value={renderedValue}
              minWidth={column.minWidth || 50}
              maxWidth={column.maxWidth}
            />
          )
        }),
      [visibleColumns, row, onRowClick, getColumnWidth]
    )

    return <Table.Tr style={rowStyle}>{renderedColumns}</Table.Tr>
  }
) as <T>(props: RowArgs<T>) => React.ReactElement

interface TBodyArgs<T> {
  data: T[]
  emptyMessage: string
  highlightRowID?: string
  visibleColumns: ColumnConfig<T>[]
  columnWidths: Record<string, number>
  onRowClick?: (row: T, otherPanel: boolean) => void
  theme: MantineTheme
  colorScheme: MantineColorScheme
  highlightColors: {backgroundColor: string; borderColor: string}
  getColumnWidth: (column: ColumnConfig<T>) => number
}

function TableBody<T>({
  data,
  emptyMessage,
  highlightRowID,
  visibleColumns,
  onRowClick,
  highlightColors,
  getColumnWidth
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

  const rows = useMemo(
    () =>
      data.map(row => (
        <TableRow
          key={(row as any).id || JSON.stringify(row)}
          visibleColumns={visibleColumns}
          row={row}
          highlightRowID={highlightRowID}
          onRowClick={onRowClick}
          highlightColors={highlightColors}
          getColumnWidth={getColumnWidth}
        />
      )),
    [
      data,
      visibleColumns,
      highlightRowID,
      onRowClick,
      highlightColors,
      getColumnWidth
    ]
  )

  return <Table.Tbody>{rows}</Table.Tbody>
}

interface LoadingTableArgs<T> {
  visibleColumns: ColumnConfig<T>[]
  loading: boolean
}

const LoadingTable = React.memo(function LoadingTable<T>({
  visibleColumns,
  loading
}: LoadingTableArgs<T>) {
  const headerColumns = useMemo(
    () =>
      visibleColumns.map(column => (
        <Table.Th key={String(column.key)}>
          <Skeleton height={20} />
        </Table.Th>
      )),
    [visibleColumns]
  )

  const bodyColumns = useMemo(
    () =>
      Array.from({length: 5}).map((_, index) => (
        <Table.Tr key={index}>
          {visibleColumns.map(column => (
            <Table.Td key={String(column.key)}>
              <Skeleton height={16} />
            </Table.Td>
          ))}
        </Table.Tr>
      )),
    [visibleColumns]
  )

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
}) as <T>(props: LoadingTableArgs<T>) => React.ReactElement

interface TableThArgs<T> {
  column: ColumnConfig<T>
  width: number
  sorting: SortState
  handleSort: (columnKey: string) => void
}

const TableTh = React.memo(function TableTh<T>({
  column,
  width,
  sorting,
  handleSort
}: TableThArgs<T>) {
  const getSortIcon = useCallback(
    (columnKey: string) => {
      if (sorting.column !== columnKey) {
        return <IconSelector size={14} />
      }
      return sorting.direction === "asc" ? (
        <IconChevronUp size={14} />
      ) : (
        <IconChevronDown size={14} />
      )
    },
    [sorting]
  )

  const handleClick = useCallback(() => {
    if (column.sortable) {
      handleSort(String(column.key))
    }
  }, [column.sortable, column.key, handleSort])

  const thStyle = useMemo(
    () => ({
      width,
      minWidth: column.minWidth || 50,
      maxWidth: column.maxWidth,
      position: "relative" as const,
      userSelect: "none" as const
    }),
    [width, column.minWidth, column.maxWidth]
  )

  const groupStyle = useMemo(
    () => ({
      cursor: column.sortable ? "pointer" : "default",
      flex: 1
    }),
    [column.sortable]
  )

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
}) as <T>(props: TableThArgs<T>) => React.ReactElement

interface TableHeaderArgs<T> {
  visibleColumns: ColumnConfig<T>[]
  sorting: SortState
  handleSort: (columnKey: string) => void
  columnWidths: Record<string, number>
  getColumnWidth: (column: ColumnConfig<T>) => number // Added this prop
}

const TableHeader = React.memo(function TableHeader<T>({
  visibleColumns,
  sorting,
  handleSort,
  getColumnWidth // Use the passed function instead of defining locally
}: TableHeaderArgs<T>) {
  const columns = useMemo(
    () =>
      visibleColumns.map(column => (
        <TableTh
          key={String(column.key)}
          column={column}
          width={getColumnWidth(column)}
          sorting={sorting}
          handleSort={handleSort}
        />
      )),
    [visibleColumns, getColumnWidth, sorting, handleSort]
  )

  return (
    <Table.Thead>
      <Table.Tr>{columns}</Table.Tr>
    </Table.Thead>
  )
}) as <T>(props: TableHeaderArgs<T>) => React.ReactElement
