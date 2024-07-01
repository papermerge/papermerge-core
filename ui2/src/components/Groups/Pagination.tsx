import {Pagination, Skeleton, Group, Select, rem} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {selectPagination, fetchGroups} from "@/slices/groups"
import classes from "./Pagination.module.css"
import {PAGINATION_PAGE_SIZES} from "@/cconstants"

export default function GroupPagination() {
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)

  const onPageNumberChange = (page: number) => {
    dispatch(fetchGroups({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchGroups({pageNumber: 1, pageSize: parseInt(value)}))
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
