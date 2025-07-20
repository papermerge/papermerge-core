import {Box, Menu, rem} from "@mantine/core"
import {
  IconArrowBackUp,
  IconArrowLeft,
  IconArrowMoveDown,
  IconArrowRight,
  IconEdit,
  IconEye,
  IconRotate,
  IconRotateClockwise,
  IconTrash,
  IconX
} from "@tabler/icons-react"

import type {
  ExtractPagesDirection,
  I18NViewerContextMenu,
  MoveDocumentDirection
} from "./types"

interface Args {
  opened: boolean
  position: {
    x: number
    y: number
  }
  onChange?: (opened: boolean) => void
  width?: number
  onChangeTitleItemClicked?: () => void
  onViewOCRedTextItemClicked?: () => void
  onRotateCWItemClicked?: () => void
  onRotateCCItemClicked?: () => void
  onResetChangesItemClicked?: () => void
  onSaveChangesItemClicked?: () => void
  onDeletePagesItemClicked?: () => void
  onMoveDocumentItemClicked?: () => void
  onExtractPagesItemClicked?: () => void
  onDeleteDocumentItemClicked?: () => void
  showViewOCRedTextItem?: boolean
  showChangeTitleItem?: boolean
  showRotateCWItem?: boolean
  showRotateCCItem?: boolean
  showResetChangesItem?: boolean
  showSaveChangesItem?: boolean
  showDeletePagesItem?: boolean
  showMoveDocumentItem?: MoveDocumentDirection
  showExtractPagesItem?: ExtractPagesDirection
  showDeleteDocumentItem?: boolean
  txt?: I18NViewerContextMenu
}

const DEFAULT_CONTEXT_MENU_WIDTH = 230
const ICON_CSS = {width: rem(18), height: rem(18)}

export default function ContextMenu({
  opened,
  txt,
  onChange,
  position,
  onChangeTitleItemClicked,
  onViewOCRedTextItemClicked,
  onRotateCWItemClicked,
  onRotateCCItemClicked,
  onResetChangesItemClicked,
  onSaveChangesItemClicked,
  onDeletePagesItemClicked,
  onMoveDocumentItemClicked,
  onExtractPagesItemClicked,
  onDeleteDocumentItemClicked,
  width = DEFAULT_CONTEXT_MENU_WIDTH,
  showChangeTitleItem = true,
  showViewOCRedTextItem = true,
  showRotateCWItem = true,
  showRotateCCItem = true,
  showResetChangesItem = true,
  showSaveChangesItem = true,
  showDeletePagesItem = true,
  showMoveDocumentItem,
  showExtractPagesItem,
  showDeleteDocumentItem = true
}: Args) {
  return (
    <Menu
      key={`${position.x}-${position.y}-${showMoveDocumentItem}-${showExtractPagesItem}`} // 👈 force remount on position etc change
      position="bottom-start"
      opened={opened}
      onChange={onChange}
      shadow="md"
      width={width}
    >
      <Menu.Target>
        <Box
          style={{
            position: "absolute",
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: 1,
            height: 1
          }}
        ></Box>
      </Menu.Target>
      <Menu.Dropdown>
        {showChangeTitleItem && (
          <Menu.Item
            onClick={onChangeTitleItemClicked}
            leftSection={<IconEdit style={ICON_CSS} />}
          >
            {txt?.changeTitle || "Change Title"}
          </Menu.Item>
        )}
        {showViewOCRedTextItem && (
          <Menu.Item
            onClick={onViewOCRedTextItemClicked}
            leftSection={<IconEye style={ICON_CSS} />}
          >
            {txt?.ocrText || "OCR Text"}
          </Menu.Item>
        )}
        {showRotateCWItem && (
          <Menu.Item
            onClick={onRotateCWItemClicked}
            leftSection={<IconRotateClockwise style={ICON_CSS} />}
          >
            {txt?.rotateClockwise || "Rotate clockwise"}
          </Menu.Item>
        )}
        {showRotateCCItem && (
          <Menu.Item
            onClick={onRotateCCItemClicked}
            leftSection={<IconRotate style={ICON_CSS} />}
          >
            {txt?.rotateCounterClockwise || "Rotate counter-clockwise"}
          </Menu.Item>
        )}
        {showResetChangesItem && (
          <Menu.Item
            onClick={onResetChangesItemClicked}
            leftSection={<IconArrowBackUp style={ICON_CSS} />}
          >
            {txt?.resetChanges || "Reset changes"}
          </Menu.Item>
        )}
        {showSaveChangesItem && (
          <Menu.Item
            onClick={onSaveChangesItemClicked}
            leftSection={<IconArrowMoveDown style={ICON_CSS} />}
          >
            {txt?.saveChanges || "Save changes"}
          </Menu.Item>
        )}
        {showMoveDocumentItem == "left" && (
          <Menu.Item
            onClick={onMoveDocumentItemClicked}
            leftSection={<IconArrowLeft style={ICON_CSS} />}
          >
            {txt?.moveDocument || "Move Document"}
          </Menu.Item>
        )}
        {showMoveDocumentItem == "right" && (
          <Menu.Item
            onClick={onMoveDocumentItemClicked}
            leftSection={<IconArrowRight style={ICON_CSS} />}
          >
            {txt?.moveDocument || "Move Document"}
          </Menu.Item>
        )}
        {showExtractPagesItem == "left" && (
          <Menu.Item
            onClick={onExtractPagesItemClicked}
            leftSection={<IconArrowLeft style={ICON_CSS} />}
          >
            {txt?.extractPages || "Extract Pages"}
          </Menu.Item>
        )}
        {showExtractPagesItem == "right" && (
          <Menu.Item
            onClick={onExtractPagesItemClicked}
            leftSection={<IconArrowRight style={ICON_CSS} />}
          >
            {txt?.extractPages || "Extract Pages"}
          </Menu.Item>
        )}
        {showDeletePagesItem && (
          <Menu.Item
            onClick={onDeletePagesItemClicked}
            color="red"
            leftSection={<IconTrash style={ICON_CSS} />}
          >
            {txt?.deletePages || "Delete pages"}
          </Menu.Item>
        )}
        <Menu.Label>{txt?.dangerZone || "Danger zone"}</Menu.Label>
        {showDeleteDocumentItem && (
          <Menu.Item
            onClick={onDeleteDocumentItemClicked}
            color="red"
            leftSection={<IconX style={ICON_CSS} />}
          >
            {txt?.deleteDocument || "Delete Document"}
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
