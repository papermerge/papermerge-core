import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectThumbnailsPanelOpen,
  viewerThumbnailsPanelToggled
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {Flex, UnstyledButton} from "@mantine/core"
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand
} from "@tabler/icons-react"
import {useContext} from "react"
import classes from "./ThumbnailsToggle.module.css"

export default function ThumbnailsToggle() {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useAppSelector(s => selectThumbnailsPanelOpen(s, mode))

  const onClick = () => {
    dispatch(viewerThumbnailsPanelToggled(mode))
  }

  const toggleElement = (
    <UnstyledButton onClick={() => onClick()}>
      {isOpen ? (
        <IconLayoutSidebarRightExpand />
      ) : (
        <IconLayoutSidebarRightCollapse />
      )}
    </UnstyledButton>
  )

  return (
    <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
      {toggleElement}
    </Flex>
  )
}
