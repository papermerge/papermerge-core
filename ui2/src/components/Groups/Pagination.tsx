import {Pagination, Skeleton} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {selectPagination, fetchGroups} from "@/slices/groups"

export default function GroupPagination() {
  const dispatch = useDispatch()
  const pagination = useSelector(selectPagination)

  const onChange = (page: number) => {
    dispatch(fetchGroups({pageNumber: page, pageSize: pagination?.pageSize}))
  }

  if (pagination) {
    return <Pagination onChange={onChange} total={pagination.numPages} />
  }

  return (
    <Skeleton>
      <Pagination total={10} />
    </Skeleton>
  )
}
