import {Checkbox} from "@mantine/core"
import {NavLink} from "react-router-dom"
import type {NodeType} from "@/types"
import classes from "./Folder.module.css"

type Args = {
  node: NodeType
}

export default function Folder({node}: Args) {
  return (
    <div className={classes.folder}>
      <Checkbox />
      <NavLink to={`/folder/${node.id}`}>
        <div className={classes.folderIcon}></div>
        <div>{node.title}</div>
      </NavLink>
    </div>
  )
}
