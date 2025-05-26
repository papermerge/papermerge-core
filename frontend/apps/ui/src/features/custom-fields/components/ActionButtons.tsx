import {useAppSelector} from "@/app/hooks"
import QuickFilter from "@/components/QuickFilter"
import {
  selectFilterText,
  selectSelectedIds
} from "@/features/custom-fields/customFieldsSlice"
import {Group, Loader} from "@mantine/core"
import {DeleteCustomFieldsButton} from "./DeleteButton"
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
  const selectedIds = useAppSelector(selectSelectedIds)
  const filterText = useAppSelector(selectFilterText)

  return (
    <Group justify="space-between">
      <Group>
        <NewButton />
        {selectedIds.length == 1 ? (
          <EditButton customFieldId={selectedIds[0]} />
        ) : (
          ""
        )}
        {selectedIds.length >= 1 ? <DeleteCustomFieldsButton /> : ""}
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
