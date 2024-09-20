import {store} from "@/app/store"
import theme from "@/themes"
import {CType} from "@/types"
import {MantineProvider, Stack, Text} from "@mantine/core"
import {IconFile, IconFolder} from "@tabler/icons-react"

interface Args {
  nodeID: string
}

export default function DraggingIcon({nodeID}: Args) {
  const state = store.getState()
  const draggedNodeIDs = state.ui.dragndrop?.nodeIDs
  const draggedNodes = Object.values(state.nodes.entities).filter(
    i => draggedNodeIDs?.includes(i.id) || i.id == nodeID
  )
  const count = dedup(draggedNodeIDs || []).length
  // unique list of used ctypes
  const usedCTypes: Array<CType> = dedup(draggedNodes.map(n => n.ctype))
  const folderOnly = usedCTypes.includes("folder") && usedCTypes.length == 1
  const icon: JSX.Element = folderOnly ? <IconFolder /> : <IconFile />

  return (
    <MantineProvider theme={theme}>
      <Stack>
        {icon}
        <Text>Move {count} items</Text>
      </Stack>
    </MantineProvider>
  )
}

function dedup<T>(arr: Array<T>): Array<T> {
  return [...new Set(arr)]
}
