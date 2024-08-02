import {Flex} from "@mantine/core"
import {useDispatch} from "react-redux"

import {fetchPaginatedDocument} from "@/slices/dualPanel/dualPanel"
import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"
import {SearchResultNode} from "@/types"

export default function SearchResults() {
  const dispatch = useDispatch()

  const onClick = (item: SearchResultNode) => {
    if (item.entity_type == "document") {
      dispatch(
        fetchPaginatedDocument({
          nodeId: item.id,
          panel: "secondary",
          urlParams: new URLSearchParams("page_size=100")
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
