import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {Box, Group, Stack} from "@mantine/core"
import ActionButtons from "./ActionButtons"
import DocumentTypeFilter from "./DocumentTypeFilter"

export default function DocumentsByCategoryCommander() {
  return (
    <Box>
      <Group justify="space-between">
        <DocumentTypeFilter />
        <Group>
          <ActionButtons />
          <ToggleSecondaryPanel />
        </Group>
      </Group>
      <Stack>Empty</Stack>
    </Box>
  )
}
