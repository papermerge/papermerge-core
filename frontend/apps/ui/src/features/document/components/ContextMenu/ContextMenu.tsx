import {useAppSelector} from "@/app/hooks"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"
import {
  selectOtherPanelComponent,
  selectViewerPagesHaveChangedDialogVisibility
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import type {I18NViewerContextMenu} from "viewer"
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
  onDeleteDocumentItemClicked: () => void
}

export default function ContextMenuContainer({
  opened,
  position,
  onEditNodeTitleItemClicked,
  onRotateCCItemClicked,
  onRotateCWItemClicked,
  onResetChangesItemClicked,
  onSaveChangesItemClicked,
  onDeletePagesItemClicked,
  onDeleteDocumentItemClicked
}: Args) {
  const txt = useI18nText()
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
      txt={txt}
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
      onDeleteDocumentItemClicked={onDeleteDocumentItemClicked}
    />
  )
}

function useI18nText(): I18NViewerContextMenu | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NViewerContextMenu>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        changeTitle: t("viewerContextMenu.changeTitle"),
        ocrText: t("viewerContextMenu.ocrText"),
        rotateClockwise: t("viewerContextMenu.rotateClockwise"),
        rotateCounterClockwise: t("viewerContextMenu.rotateCounterClockwise"),
        resetChanges: t("viewerContextMenu.resetChanges"),
        saveChanges: t("viewerContextMenu.saveChanges"),
        moveDocument: t("viewerContextMenu.moveDocument"),
        extractPages: t("viewerContextMenu.extractPages"),
        deletePages: t("viewerContextMenu.deletePages"),
        deleteDocument: t("viewerContextMenu.deleteDocument"),
        dangerZone: t("viewerContextMenu.dangerZone")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
