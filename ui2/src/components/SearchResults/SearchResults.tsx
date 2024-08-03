import {Flex} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import type {RootState} from "@/app/types"

import {
  fetchPaginatedDocument,
  fetchPaginatedNodes,
  selectLastPageSize,
  setCurrentNode
} from "@/slices/dualPanel/dualPanel"
import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"
import {NType} from "@/types"

export default function SearchResults() {
  const dispatch = useDispatch()
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, "secondary")
  )

  const onClick = (item: NType) => {
    if (item.ctype == "document") {
      dispatch(
        fetchPaginatedDocument({
          nodeId: item.id,
          panel: "secondary",
          urlParams: new URLSearchParams("page_size=100")
        })
      )
    } else if (item.ctype == "folder") {
      dispatch(
        fetchPaginatedNodes({
          nodeId: item.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
      dispatch(
        setCurrentNode({
          node: {id: item.id, ctype: "folder", breadcrumb: null},
          panel: "secondary"
        })
      )
    }
  }

  return (
    <div>
      <ActionButtons />
      <Flex style={{height: "740px"}}>
        <SearchResultItems onClick={onClick} />
      </Flex>
    </div>
  )
}
