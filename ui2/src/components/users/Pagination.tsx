import {Pagination, Skeleton, Group, Select} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {selectPagination, fetchUsers, selectLastPageSize} from "@/slices/users"
import classes from "./Pagination.module.css"
import {PAGINATION_PAGE_SIZES} from "@/cconstants"

export default function UserPagination() {
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)
  const lastPageSize = useSelector(selectLastPageSize)

  const onPageNumberChange = (page: number) => {
    dispatch(fetchUsers({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(fetchUsers({pageNumber: 1, pageSize: parseInt(value)}))
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
