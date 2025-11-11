import {Group} from "@mantine/core"
import ColumnSelectorContainer from "./ColumnSelector"

export default function ActionButtons() {
  return (
    <Group justify="end" w={"100%"}>
      <ColumnSelectorContainer />
    </Group>
  )
}
