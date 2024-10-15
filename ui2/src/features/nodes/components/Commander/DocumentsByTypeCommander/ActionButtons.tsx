import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {Group} from "@mantine/core"
import ViewOptionsMenu from "../ViewOptionsMenu"
import DocumentTypeFilter from "./DocumentTypeFilter"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <DocumentTypeFilter />
      <Group>
        <ViewOptionsMenu />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
