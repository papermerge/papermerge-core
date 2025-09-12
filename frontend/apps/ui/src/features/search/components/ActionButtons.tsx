import {Group} from "@mantine/core"

import GoBackButton from "./GoBackButton"
import OpenInOtherPanelCheckbox from "./OpenInOtherPanelCheckbox"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <Group>
        <GoBackButton />
        <OpenInOtherPanelCheckbox />
      </Group>
      {/*
      <Group>
        <ToggleSecondaryPanel />
      </Group>
      */}
    </Group>
  )
}
