import {Pagination, Skeleton, Group, Select} from "@mantine/core"
import classes from "./Pagination.module.css"
import {PAGINATION_PAGE_SIZES} from "@/cconstants"

import type {PaginationType} from "@/types"

type Args = {
  pagination: PaginationType | null | undefined
  onPageNumberChange: (page: number) => void
  onPageSizeChange: (value: string | null) => void
  lastPageSize: number
}

export default function PaginationWithSelector({
  pagination,
  lastPageSize,
  onPageNumberChange,
  onPageSizeChange
}: Args) {
  if (pagination) {
    return (
      <Group>
        <Pagination
          onChange={onPageNumberChange}
          value={pagination.pageNumber}
          total={pagination.numPages}
        />
        <Select
          className={classes.select}
          value={`${pagination.pageSize}`}
          onChange={onPageSizeChange}
          defaultValue={`${lastPageSize}`}
          data={PAGINATION_PAGE_SIZES}
        />
      </Group>
    )
  }

  return (
    <Skeleton>
      <Pagination total={10} />
    </Skeleton>
  )
}
