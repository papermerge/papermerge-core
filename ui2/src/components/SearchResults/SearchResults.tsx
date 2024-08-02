import {Flex} from "@mantine/core"

import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"

export default function SearchResults() {
  return (
    <div>
      <ActionButtons />
      <Flex style={{height: "740px"}}>
        <SearchResultItems />
      </Flex>
    </div>
  )
}
