import {useContext} from "react"
import {useNavigate} from "react-router-dom"

import type {PanelMode, NType} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"

export default function Viewer() {
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()

  const onClick = (node: NType) => {
    if (mode == "secondary" && node.ctype == "folder") {
    } else if (mode == "main" && node.ctype == "folder") {
      navigate(`/folder/${node.id}`)
    }
  }
  return (
    <div>
      <Breadcrumbs onClick={onClick} />
    </div>
  )
}
