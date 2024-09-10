import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectThumbnailsPanelOpen,
  viewerThumbnailsPanelToggled
} from "@/features/ui/uiSlice"
import {
  applyPageOpChanges,
  resetPageChanges,
  selectPagesHaveChanged,
  selectPagesRaw
} from "@/slices/dualPanel/dualPanel"
import {PanelMode} from "@/types"
import {
  Button,
  Flex,
  Group,
  Popover,
  Stack,
  Tooltip,
  UnstyledButton
} from "@mantine/core"
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand
} from "@tabler/icons-react"
import {useContext, useState} from "react"
import classes from "./ThumbnailsToggle.module.css"

export default function ThumbnailsToggle() {
  const [dontBotherMe, setDontBotherMe] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useAppSelector(s => selectThumbnailsPanelOpen(s, mode))
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const pages = useAppSelector(s => selectPagesRaw(s, mode))

  const onClick = () => {
    dispatch(viewerThumbnailsPanelToggled(mode))
  }

  const onSave = () => {
    if (pages) {
      const _pages = pages.map(p => {
        return {
          angle: p.angle,
          page: {id: p.page.id, number: p.page.number}
        }
      })
      dispatch(applyPageOpChanges({pages: _pages, panel: mode}))
    }
  }

  const onReset = () => {
    dispatch(resetPageChanges(mode))
  }

  const onClosePopover = () => {
    setDontBotherMe(true)
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

  if (pagesHaveChanged && !dontBotherMe) {
    return (
      <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
        <Popover
          opened={true}
          onChange={() => {}}
          position="right"
          withArrow
          shadow="md"
        >
          <Popover.Target>{toggleElement}</Popover.Target>
          <Popover.Dropdown>
            <PopoverBody
              onSave={onSave}
              onReset={onReset}
              onClose={onClosePopover}
            />
          </Popover.Dropdown>
        </Popover>
      </Flex>
    )
  }

  return (
    <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
      {toggleElement}
    </Flex>
  )
}

type Args = {
  onSave: () => void
  onReset: () => void
  onClose: () => void
}

function PopoverBody({onSave, onReset, onClose}: Args) {
  return (
    <Stack>
      Changes are not yet saved on the server
      <Group>
        <Tooltip
          multiline
          w={220}
          withArrow
          openDelay={1000}
          label="Apply changes to the server. Once applied, document version
        will increase by one"
        >
          <Button onClick={onSave}>Save</Button>
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label="Discard changes. This will bring pages in their initial state (same as on server)"
        >
          <Button onClick={onReset} variant="default">
            Reset
          </Button>
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label="Close this dialog. You can apply changes later from the context menu"
        >
          <Button onClick={onClose} variant="default">
            Don't bother me
          </Button>
        </Tooltip>
      </Group>
    </Stack>
  )
}
