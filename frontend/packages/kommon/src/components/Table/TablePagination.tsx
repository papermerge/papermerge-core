import {Group, Pagination, Select, Text} from "@mantine/core"
import {TFunction} from "i18next"

interface Args {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  totalItems?: number
  t?: TFunction // Optional translation function
}

export default function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50, 100],
  t
}: Args) {
  const startItem = totalPages > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(
    currentPage * pageSize,
    totalItems || currentPage * pageSize
  )
  const data = pageSizeOptions.map(size => ({
    value: String(size),
    label: String(size)
  }))
  // Default English translations fallback
  const defaultTranslations = {
    "pagination.pageSize": "Page size",
    "pagination.itemsRange": "{{start}} - {{end}} of {{total}}",
    "pagination.itemsRangeNoTotal": "{{start}} - {{end}}",
    "pagination.noItems": "No items"
  }

  // Translation helper with fallback
  const translate = (key: string, options?: {[key: string]: any}): string => {
    if (t) {
      return t(key, options)
    }

    let translation =
      defaultTranslations[key as keyof typeof defaultTranslations] || key

    // Simple interpolation for fallback
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(
          new RegExp(`{{${optionKey}}}`, "g"),
          String(options[optionKey])
        )
      })
    }

    return translation
  }

  return (
    <Group justify="end" wrap="wrap">
      <Group>
        <Group gap="xs">
          <Select
            size="xs"
            data={data}
            value={String(pageSize)}
            onChange={value => value && onPageSizeChange?.(Number(value))}
            w={60}
            placeholder={translate("pagination.pageSize")}
          />
        </Group>

        <Text size="sm" c="dimmed">
          {translate("pagination.itemsRange", {
            start: startItem,
            end: endItem,
            total: totalItems
          })}
        </Text>
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
