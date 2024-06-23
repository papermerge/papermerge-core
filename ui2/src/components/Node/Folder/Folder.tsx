import {Checkbox} from "@mantine/core"
import type {NodeType} from "@/types"
import classes from "./Folder.module.css"

type Args = {
  node: NodeType
}

export default function Folder({node}: Args) {
  return (
    <div>
      <Checkbox />
      <div className={classes.folder}></div>
      <div>{node.title}</div>
    </div>
  )
}
