import {Pagination, Skeleton, Group, Select} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {selectPagination, fetchTags} from "@/slices/tags"
import classes from "./Pagination.module.css"
import {PAGINATION_PAGE_SIZES} from "@/cconstants"

export default function TagsPagination() {
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)

  const onPageNumberChange = (page: number) => {
    dispatch(fetchTags({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchTags({pageNumber: 1, pageSize: parseInt(value)}))
    }
  }

  if (pagination) {
    return (
      <Group>
        <Pagination onChange={onPageNumberChange} total={pagination.numPages} />
        <Select
          className={classes.select}
          value={`${pagination.pageSize}`}
          onChange={onPageSizeChange}
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
