import {useAppSelector} from "@/app/hooks"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"
import {
  selectOtherPanelComponent,
  selectViewerPagesHaveChangedDialogVisibility
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useEffect, useState} from "react"
import {ContextMenu, ExtractPagesDirection, MoveDocumentDirection} from "viewer"

interface Args {
  opened: boolean
  position: {
    x: number
    y: number
  }
  onEditNodeTitleItemClicked: () => void
  onRotateCWItemClicked: () => void
  onRotateCCItemClicked: () => void
  onResetChangesItemClicked: () => void
  onSaveChangesItemClicked: () => void
  onDeletePagesItemClicked: () => void
}

export default function ContextMenuContainer({
  opened,
  position,
  onEditNodeTitleItemClicked,
  onRotateCCItemClicked,
  onRotateCWItemClicked,
  onResetChangesItemClicked,
  onSaveChangesItemClicked,
  onDeletePagesItemClicked
}: Args) {
  const [showExtractPagesItem, setShowExtractPagesItem] = useState<
    ExtractPagesDirection | undefined
  >()
  const [showMoveDocumentItem, setShowMoveDocumentItem] = useState<
    MoveDocumentDirection | undefined
  >()
  const {docVer} = useCurrentDocVer()
  const mode = usePanelMode()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})
  const otherPanelComponent = useAppSelector(s =>
    selectOtherPanelComponent(s, mode)
  )
  const visibility = useAppSelector(
    selectViewerPagesHaveChangedDialogVisibility
  )
  const showPagesHaveChangedRelatedItems = visibility == "opened"

  const hasSelectedPages = selectedPages && selectedPages.length > 0

  useEffect(() => {
    if (hasSelectedPages && otherPanelComponent == "commander") {
      if (mode == "main") {
        setShowExtractPagesItem("right")
      } else {
        setShowExtractPagesItem("left")
      }
    } else {
      setShowExtractPagesItem(undefined)
    }

    if (otherPanelComponent == "commander") {
      if (mode == "main") {
        setShowMoveDocumentItem("right")
      } else {
        setShowMoveDocumentItem("left")
      }
    } else {
      setShowMoveDocumentItem(undefined)
    }
  }, [hasSelectedPages, mode, otherPanelComponent])

  return (
    <ContextMenu
      opened={opened}
      position={position}
      showExtractPagesItem={showExtractPagesItem}
      showMoveDocumentItem={showMoveDocumentItem}
      showDeletePagesItem={hasSelectedPages}
      showRotateCCItem={hasSelectedPages}
      showRotateCWItem={hasSelectedPages}
      showResetChangesItem={showPagesHaveChangedRelatedItems}
      showSaveChangesItem={showPagesHaveChangedRelatedItems}
      showViewOCRedTextItem={false}
      onChangeTitleItemClicked={onEditNodeTitleItemClicked}
      onRotateCCItemClicked={onRotateCCItemClicked}
      onRotateCWItemClicked={onRotateCWItemClicked}
      onResetChangesItemClicked={onResetChangesItemClicked}
      onSaveChangesItemClicked={onSaveChangesItemClicked}
      onDeletePagesItemClicked={onDeletePagesItemClicked}
    />
  )
}
