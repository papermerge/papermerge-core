// components/DataTable/DataTable.tsx
import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  ScrollArea,
  Skeleton,
  Table,
  Text
} from "@mantine/core"
import {
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconSelector
} from "@tabler/icons-react"
import React, {useEffect, useRef} from "react"
import {ColumnConfig, SortState} from "./types"
import {useColumnResize} from "./useDataTable"

interface Args<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sorting: SortState
  onSortChange: (sort: SortState) => void
  columnWidths: Record<string, number>
  onColumnResize: (columnKey: string, width: number) => void
  loading?: boolean
  emptyMessage?: string
  style?: React.CSSProperties
  onRowClick?: (row: T, otherPanel: boolean) => void
}

export default function DataTable<T>({
  data,
  columns,
  sorting,
  onSortChange,
  columnWidths,
  onColumnResize,
  loading = false,
  emptyMessage = "No data available",
  style,
  onRowClick
}: Args<T>) {
  const tableRef = useRef<HTMLTableElement>(null)
  const {isResizing, startResize, stopResize, getNewWidth} = useColumnResize()

  // Only show visible columns
  const visibleColumns = columns.filter(col => col.visible !== false)

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = getNewWidth(e.clientX)
        onColumnResize(isResizing, newWidth)
      }
    }

    const handleMouseUp = () => {
      stopResize()
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, getNewWidth, onColumnResize, stopResize])

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

  const getColumnWidth = (column: ColumnConfig<T>) => {
    const customWidth = columnWidths[String(column.key)]
    if (customWidth) return customWidth
    if (column.width) return column.width
    return 150 // Default width
  }

  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    const currentWidth = getColumnWidth(
      columns.find(col => col.key === columnKey)!
    )
    startResize(columnKey, e.clientX, currentWidth)
  }

  if (loading && data.length === 0) {
    return (
      <Box pos="relative" mih={400}>
        <LoadingOverlay visible={loading} />
        <Table>
          <Table.Thead>
            <Table.Tr>
              {visibleColumns.map(column => (
                <Table.Th key={String(column.key)}>
                  <Skeleton height={20} />
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({length: 5}).map((_, index) => (
              <Table.Tr key={index}>
                {visibleColumns.map(column => (
                  <Table.Td key={String(column.key)}>
                    <Skeleton height={16} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    )
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <ScrollArea>
        <Table
          ref={tableRef}
          striped
          highlightOnHover
          withTableBorder
          style={{
            cursor: isResizing ? "col-resize" : "default",
            ...style
          }}
        >
          <Table.Thead>
            <Table.Tr>
              {visibleColumns.map(column => {
                const width = getColumnWidth(column)
                return (
                  <Table.Th
                    key={String(column.key)}
                    style={{
                      width,
                      minWidth: column.minWidth || 50,
                      maxWidth: column.maxWidth,
                      position: "relative",
                      userSelect: "none"
                    }}
                  >
                    <Group gap="xs" wrap="nowrap" justify="space-between">
                      <Group
                        gap="xs"
                        style={{
                          cursor: column.sortable ? "pointer" : "default",
                          flex: 1
                        }}
                        onClick={() =>
                          column.sortable && handleSort(String(column.key))
                        }
                      >
                        <Text size="sm" fw={500}>
                          {column.label}
                        </Text>
                        {column.sortable && (
                          <ActionIcon variant="subtle" color="gray" size="xs">
                            {getSortIcon(String(column.key))}
                          </ActionIcon>
                        )}
                      </Group>

                      {/* Resize handle */}
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 6,
                          cursor: "col-resize",
                          backgroundColor:
                            isResizing === String(column.key)
                              ? "var(--mantine-color-blue-6)"
                              : "transparent",
                          opacity: 0.7
                        }}
                        onMouseDown={e =>
                          handleResizeStart(e, String(column.key))
                        }
                      >
                        <IconGripVertical
                          size={12}
                          style={{
                            position: "absolute",
                            right: -3,
                            top: "50%",
                            transform: "translateY(-50%)",
                            opacity: 0.5
                          }}
                        />
                      </div>
                    </Group>
                  </Table.Th>
                )
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={visibleColumns.length}
                  style={{textAlign: "center", padding: "3rem"}}
                >
                  <Text c="dimmed">{emptyMessage}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              data.map((row, index) => (
                <Table.Tr key={index}>
                  {visibleColumns.map(column => {
                    const value = row[column.key]
                    const width = getColumnWidth(column)

                    return (
                      <Table.Td
                        key={String(column.key)}
                        style={{
                          width,
                          minWidth: column.minWidth || 50,
                          maxWidth: column.maxWidth,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {column.render
                          ? column.render(value, row, onRowClick)
                          : String(value)}
                      </Table.Td>
                    )
                  })}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  )
}
