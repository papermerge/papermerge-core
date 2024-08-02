import {Group} from "@mantine/core"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <Group>Some button here</Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
