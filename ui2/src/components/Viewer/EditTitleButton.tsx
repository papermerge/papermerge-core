import {ActionIcon, Tooltip} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"
;("@/slices/dualPanel/dualPanel")
//import edit_node_title from "@/components/modals/EditNodeTitle"

export default function EditTitleButton() {
  //const dispatch = useDispatch()
  // const selectedNodes = useSelector((state: RootState) =>
  //  selectSelectedNodes(state, mode)
  // )
  const onEditNodeTitle = () => {
    // if (selectedNodes.length < 1) {
    //  console.log("Error: no selected nodes")
    //  return
    // }
    //let node: NodeType = selectedNodes[0]
    /*
    edit_node_title(node)
      .then((node: NodeType) => {
        dispatch(nodeUpdated({node, mode}))
      })
      .finally(() => dispatch(clearNodesSelection(mode)))
     */
  }

  return (
    <Tooltip label="Change title" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onEditNodeTitle}>
        <IconEdit stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
