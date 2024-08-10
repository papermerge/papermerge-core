import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"
import {UnstyledButton, Flex} from "@mantine/core"
import {
  IconLayoutSidebarRightExpand,
  IconLayoutSidebarRightCollapse
} from "@tabler/icons-react"
import classes from "./ThumbnailsToggle.module.css"
import {
  toggleThumbnailsPanel,
  selectThumbnailsPanelOpen
} from "@/slices/dualPanel/dualPanel"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"
import {RootState} from "@/app/types"

export default function ThumbnailsToggle() {
  const dispatch = useDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  const onClick = () => {
    dispatch(toggleThumbnailsPanel(mode))
  }

  if (isOpen) {
    return (
      <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
        <UnstyledButton onClick={() => onClick()}>
          <IconLayoutSidebarRightExpand />
        </UnstyledButton>
      </Flex>
    )
  }

  return (
    <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
      <UnstyledButton onClick={() => onClick()}>
        <IconLayoutSidebarRightCollapse />
      </UnstyledButton>
    </Flex>
  )
}
