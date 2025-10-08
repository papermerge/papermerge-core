import {Group} from "@mantine/core"
import ColumnSelectorContainer from "./ColumnSelector"

import {usePanelMode} from "@/hooks"
import type {DocumentByCategoryItem} from "../types"
import SelectDocumentCategory from "./SelectDocumentCategory"

interface Args {
  items: DocumentByCategoryItem[]
}

export default function ActionButtons({items}: Args) {
  const mode = usePanelMode()

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <SelectDocumentCategory />
      </Group>
      <Group>
        <ColumnSelectorContainer items={items} />
      </Group>
    </Group>
  )
}
