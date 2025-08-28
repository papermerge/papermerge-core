// components/TablePagination/TablePagination.tsx
import {Group, Pagination, Select, Text} from "@mantine/core"

interface Args {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  totalItems?: number
}

export default function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50, 100],
  totalItems
}: Args) {
  const startItem = totalPages > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(
    currentPage * pageSize,
    totalItems || currentPage * pageSize
  )

  return (
    <Group justify="space-between" wrap="wrap">
      <Group>
        <Group gap="xs">
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
        </Group>

        {totalItems && (
          <Text size="sm" c="dimmed">
            {startItem} - {endItem} of {totalItems}
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
