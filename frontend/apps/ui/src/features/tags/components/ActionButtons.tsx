import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/tags/storage/tag"
import {Group} from "@mantine/core"

import {usePanelMode} from "@/hooks"
import ColumnSelector from "./ColumnSelector"
import {DeleteTagsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {hasOneSelected && <EditButton tagId={selectedIds[0]} />}
        {hasAnySelected && <DeleteTagsButton />}
      </Group>
      <Group>
        <ColumnSelector />
      </Group>
    </Group>
  )
}
