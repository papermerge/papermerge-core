import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconRotate} from "@tabler/icons-react"
import {rotatePages, selectSelectedPages} from "@/slices/dualPanel/dualPanel"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"
import type {RootState} from "@/app/types"

export default function RotateCCButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const selectedPages = useSelector((state: RootState) =>
    selectSelectedPages(state, mode)
  )
  const onClick = () => {
    const pages = selectedPages.map(p => p.page)
    dispatch(rotatePages({mode, pages, angle: -90}))
  }

  return (
    <Tooltip label="Rotate selected pages counter-clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
