import {Group} from "@mantine/core"

import DownloadButton from "./DownloadButton"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <Group>
        <DownloadButton />
      </Group>
    </Group>
  )
}
