import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {Group} from "@mantine/core"
import ColumnsMenu from "./ColumnsMenu"
import DocumentTypeFilter from "./DocumentTypeFilter"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <DocumentTypeFilter />
      <Group>
        <ColumnsMenu />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
