import QuickFilter from "@/components/QuickFilter"
import {selectFilterText, selectSelectedIds} from "@/features/tags/tagsSlice"
import {Group, Loader} from "@mantine/core"
import {useSelector} from "react-redux"
import {DeleteTagsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

interface Args {
  isFetching?: boolean
  onQuickFilterChange: (value: string) => void
  onQuickFilterClear: () => void
}

export default function ActionButtons({
  isFetching,
  onQuickFilterChange,
  onQuickFilterClear
}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const filterText = useSelector(selectFilterText)

  return (
    <Group justify="space-between">
      <Group>
        <NewButton />
        {selectedIds.length == 1 ? <EditButton tagId={selectedIds[0]} /> : ""}
        {selectedIds.length >= 1 ? <DeleteTagsButton /> : ""}
        {isFetching && <Loader size={"sm"} />}
      </Group>
      <Group>
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
      </Group>
    </Group>
  )
}
