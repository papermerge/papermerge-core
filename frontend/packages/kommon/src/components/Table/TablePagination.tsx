// components/TablePagination/TablePagination.tsx
import {Group, Pagination, Select, Text} from "@mantine/core"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  totalItems?: number
}

export default function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100],
  showPageSizeSelector = true,
  totalItems
}: TablePaginationProps) {
  const startItem = totalPages > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(
    currentPage * pageSize,
    totalItems || currentPage * pageSize
  )

  return (
    <Group justify="space-between" mt="md" wrap="wrap">
      <Group>
        {showPageSizeSelector && (
          <Group gap="xs">
            <Text size="sm">Show</Text>
            <Select
              size="xs"
              data={pageSizeOptions.map(size => ({
                value: String(size),
                label: String(size)
              }))}
              value={String(pageSize)}
              onChange={value => value && onPageSizeChange(Number(value))}
              w={70}
            />
            <Text size="sm">entries</Text>
          </Group>
        )}

        {totalItems && (
          <Text size="sm" c="dimmed">
            Showing {startItem} to {endItem} of {totalItems} entries
          </Text>
        )}
      </Group>

      <Pagination
        value={currentPage}
        onChange={onPageChange}
        total={totalPages}
        size="sm"
        withEdges
        siblings={1}
        boundaries={1}
      />
    </Group>
  )
}
