import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelAllCustom,
  setPanelCustomState
} from "@/features/ui/panelRegistry"
import {Flex, UnstyledButton} from "@mantine/core"
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand
} from "@tabler/icons-react"
import classes from "./ThumbnailsToggle.module.css"

export default function ThumbnailsToggle() {
  const dispatch = useAppDispatch()
  const {panelId} = usePanel()

  //const isOpen = useAppSelector(s => selectThumbnailsPanelOpen(s, mode))
  const {thumbnailPanelIsOpen: isOpen} = useAppSelector(s =>
    selectPanelAllCustom(s, panelId)
  )

  const onClick = () => {
    //dispatch(viewerThumbnailsPanelToggled(mode))
    dispatch(
      setPanelCustomState({
        panelId,
        key: "thumbnailPanelIsOpen",
        value: !isOpen
      })
    )
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
