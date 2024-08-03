import {Group} from "@mantine/core"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import GoBackButton from "./GoBackButton"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <Group>
        <GoBackButton />
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
