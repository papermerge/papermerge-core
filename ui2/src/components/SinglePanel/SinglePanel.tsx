import {selectPanelComponents} from "@/slices/dualPanel"
import {useSelector} from "react-redux"
import Commander from "@/components/Commander"
import Viewer from "@/components/Viewer"
import {PanelMode} from "@/types"
import {RootState} from "@/app/types"

type Args = {
  mode: PanelMode
}

export default function SinglePanel({mode}: Args) {
  const [commander, viewer] = useSelector((state: RootState) =>
    selectPanelComponents(state, mode)
  )
  if (commander) {
    return <Commander mode={mode} />
  } else if (viewer) {
    return <Viewer mode={mode} />
  }

  return <></>
}
