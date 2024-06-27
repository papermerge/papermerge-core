import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectPanels} from "@/slices/dualPanel"
import SinglePanel from "@/components/SinglePanel"

export default function DualPanel() {
  const [_, secondaryPanel] = useSelector(selectPanels)

  if (secondaryPanel) {
    return (
      <Group grow justify="space-between">
        <SinglePanel mode="main" />
        <SinglePanel mode="secondary" />
      </Group>
    )
  }

  return <SinglePanel mode="main" />
}
