import {Group} from "@mantine/core"
import ColumnSelectorContainer from "./ColumnSelector"

import type {DocumentByCategoryItem} from "../types"

interface Args {
  items: DocumentByCategoryItem[]
}

export default function ActionButtons({items}: Args) {
  return (
    <Group justify="space-between" w={"100%"}>
      <ColumnSelectorContainer items={items} />
    </Group>
  )
}
