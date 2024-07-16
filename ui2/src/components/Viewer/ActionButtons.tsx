import {Group} from "@mantine/core"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import EditTitleButton from "./EditTitleButton"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <Group>
        <EditTitleButton />
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
