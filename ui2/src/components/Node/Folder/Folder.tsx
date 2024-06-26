import {Checkbox} from "@mantine/core"
import type {NodeType} from "@/types"
import classes from "./Folder.module.css"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Folder({node, onClick}: Args) {
  return (
    <div className={classes.folder}>
      <Checkbox />
      <a onClick={() => onClick(node)}>
        <div className={classes.folderIcon}></div>
        <div>{node.title}</div>
      </a>
    </div>
  )
}
