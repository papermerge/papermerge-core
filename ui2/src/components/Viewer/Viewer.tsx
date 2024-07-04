import {PanelMode} from "@/types"

type Args = {
  mode: PanelMode
}

export default function Viewer({mode}: Args) {
  return <div>Viewer {mode}</div>
}
