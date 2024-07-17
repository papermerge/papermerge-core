import {Group} from "@mantine/core"
import {useContext} from "react"
import {useNavigate} from "react-router-dom"

import type {PanelMode, NType} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import ActionButtons from "./ActionButtons"
import Pages from "./Pages"
import Thumbnails from "./Thumbnails"

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
      <ActionButtons />
      <Breadcrumbs onClick={onClick} />
      <Group>
        <Thumbnails />
        <Pages />
      </Group>
    </div>
  )
}
