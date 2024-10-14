import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  useApplyPageOpChangesMutation,
  useGetDocumentQuery
} from "@/features/document/apiSlice"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {useGetFolderQuery} from "@/features/nodes/apiSlice"
import ExtractPagesModal from "@/features/nodes/components/Commander/NodesCommander/ExtractPagesModal"
import {
  selectCurrentDocVerID,
  selectCurrentNodeID,
  selectOtherPanelComponent
} from "@/features/ui/uiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import type {Coord, PanelMode} from "@/types"
import {otherPanel} from "@/utils"
import {Box, Menu, rem} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {skipToken} from "@reduxjs/toolkit/query"
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
import {useContext, useRef} from "react"
import {useNavigate} from "react-router-dom"
import DeleteEntireDocumentConfirm from "./DeleteEntireDocumentConfirm"
import DeletePagesButton from "./DeletePagesButton"
import EditTitleButton from "./EditTitleButton"
import MoveDocumentDialogConfirm from "./MoveDocumentDialogConfirm"
import PageOCRDialog from "./PageOCRDialog"
import RotateButton from "./RotateButton"
import RotateCCButton from "./RotateCCButton"

interface Args {
  opened: boolean
  onChange: (opened: boolean) => void
  position: Coord
}

const ICON_CSS = {width: rem(18), height: rem(18)}

const DELETE_DOCUMENT_TEXT =
  "Are you sure you want to delete entire document with all its versions?"

export default function ContextMenu({position, opened, onChange}: Args) {
  const dispatch = useAppDispatch()
  const [delDocOpened, {open: delDocOpen, close: delDocClose}] =
    useDisclosure(false)
  const [
    pageOCRDialogOpened,
    {open: pageOCRDialogOpen, close: pageOCRDialogClose}
  ] = useDisclosure(false)
  const [
    moveDocumentDialogConfirmOpened,
    {open: moveDocumentDialogConfirmOpen, close: moveDocumentDialogConfirmClose}
  ] = useDisclosure(false)
  const [
    extractPagesDialogOpened,
    {open: extractPagesDialogOpen, close: extractPagesDialogClose}
  ] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const hasSelectedPages = selectedPages && selectedPages.length > 0
  const refEditTitleButton = useRef<HTMLButtonElement>(null)
  const refRotateButton = useRef<HTMLButtonElement>(null)
  const refRotateCCButton = useRef<HTMLButtonElement>(null)
  const refDeletePagesButton = useRef<HTMLButtonElement>(null)
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc} = useGetDocumentQuery(docID!)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const [applyPageOpChanges] = useApplyPageOpChangesMutation()
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []
  const otherPanelComponent = useAppSelector(s =>
    selectOtherPanelComponent(s, mode)
  )
  const other = otherPanel(mode)
  const targetFolderID = useAppSelector(s => selectCurrentNodeID(s, other))
  const {data: targetFolder} = useGetFolderQuery(targetFolderID ?? skipToken)

  const onChangeTitle = () => {
    if (refEditTitleButton.current) {
      refEditTitleButton.current.click()
    }
  }

  const onRotate = () => {
    if (refRotateButton.current) {
      refRotateButton.current.click()
    }
  }

  const onRotateCC = () => {
    if (refRotateCCButton.current) {
      refRotateCCButton.current.click()
    }
  }

  const onDeletePages = () => {
    if (refDeletePagesButton.current) {
      refDeletePagesButton.current.click()
    }
  }

  const onDeleteDocument = () => {
    // open confirmation dialog
    delDocOpen()
  }

  const onDocumentDeleted = () => {
    // document was already deleted
    delDocClose() // close confirmation dialog
    navigate(`/home/${user.home_folder_id}`)
  }

  const onApplyPagesOpChanges = async () => {
    const pageData = pages.map(p => {
      const result = {
        angle: p.angle,
        page: {
          number: p.number,
          id: p.id
        }
      }
      return result
    })
    await applyPageOpChanges({pages: pageData, documentID: docID!})
  }

  const onViewOCRedText = async () => {
    pageOCRDialogOpen()
  }

  const onResetPagesChanges = () => {
    dispatch(pagesReseted(docVerID!))
  }

  const onMoveDocumentConfirm = () => {
    moveDocumentDialogConfirmOpen()
  }

  const onExtractPages = () => {
    extractPagesDialogOpen()
  }

  return (
    <>
      <Menu
        position="bottom-start"
        opened={opened}
        onChange={onChange}
        shadow="md"
        width={230}
      >
        <Menu.Target>
          <Box
            style={{
              position: "absolute",
              top: `${position.y}px`,
              left: `${position.x}px`
            }}
          ></Box>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={onChangeTitle}
            leftSection={<IconEdit style={ICON_CSS} />}
          >
            Change title
          </Menu.Item>
          <Menu.Item
            onClick={onViewOCRedText}
            leftSection={<IconEye style={ICON_CSS} />}
          >
            OCR Text
          </Menu.Item>
          {selectedPages.length > 0 && (
            <Menu.Item
              onClick={onRotateCC}
              leftSection={<IconRotateClockwise style={ICON_CSS} />}
            >
              Rotate clockwise
            </Menu.Item>
          )}
          {selectedPages.length > 0 && (
            <Menu.Item
              onClick={onRotate}
              leftSection={<IconRotate style={ICON_CSS} />}
            >
              Rotate counter-clockwise
            </Menu.Item>
          )}
          {pagesHaveChanged && (
            <Menu.Item
              onClick={onResetPagesChanges}
              leftSection={<IconArrowBackUp style={ICON_CSS} />}
            >
              Reset changes
            </Menu.Item>
          )}
          {pagesHaveChanged && (
            <Menu.Item
              onClick={onApplyPagesOpChanges}
              leftSection={<IconArrowMoveDown style={ICON_CSS} />}
            >
              Save changes
            </Menu.Item>
          )}
          {hasSelectedPages && (
            <Menu.Item
              onClick={onDeletePages}
              color="red"
              leftSection={<IconTrash style={ICON_CSS} />}
            >
              Delete pages
            </Menu.Item>
          )}
          {otherPanelComponent == "commander" && hasSelectedPages && (
            <ExtractPagesMenuItem onClick={onExtractPages} />
          )}
          {otherPanelComponent == "commander" && (
            <MoveDocumentMenuItem onClick={onMoveDocumentConfirm} />
          )}

          <Menu.Label>Danger zone</Menu.Label>
          <Menu.Item
            onClick={onDeleteDocument}
            color="red"
            leftSection={<IconX style={ICON_CSS} />}
          >
            Delete Document
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <EditTitleButton ref={refEditTitleButton} hidden={true} />
      <RotateButton ref={refRotateButton} hidden={true} />
      <RotateCCButton ref={refRotateCCButton} hidden={true} />
      <DeletePagesButton ref={refDeletePagesButton} hidden={true} />
      <DeleteEntireDocumentConfirm
        text={DELETE_DOCUMENT_TEXT}
        opened={delDocOpened}
        onCancel={delDocClose}
        onSubmit={onDocumentDeleted}
      />
      <PageOCRDialog
        opened={pageOCRDialogOpened}
        onClose={pageOCRDialogClose}
      />
      <MoveDocumentDialogConfirm
        opened={moveDocumentDialogConfirmOpened}
        onSubmit={moveDocumentDialogConfirmClose}
        onCancel={moveDocumentDialogConfirmClose}
      />
      {hasSelectedPages &&
        otherPanelComponent == "commander" &&
        docID &&
        targetFolder &&
        doc && (
          <ExtractPagesModal
            sourcePages={selectedPages}
            sourceDocID={docID}
            targetFolder={targetFolder}
            sourceDocParentID={doc?.parent_id!}
            opened={extractPagesDialogOpened}
            onSubmit={extractPagesDialogClose}
            onCancel={extractPagesDialogClose}
          />
        )}
    </>
  )
}

interface MenuItemArgs {
  onClick: () => void
}

function MoveDocumentMenuItem({onClick}: MenuItemArgs) {
  const mode: PanelMode = useContext(PanelContext)
  if (mode == "main") {
    return (
      <Menu.Item
        onClick={onClick}
        leftSection={<IconArrowRight style={ICON_CSS} />}
      >
        Move Document
      </Menu.Item>
    )
  }

  return (
    <Menu.Item
      onClick={onClick}
      leftSection={<IconArrowLeft style={ICON_CSS} />}
    >
      Move Document
    </Menu.Item>
  )
}

function ExtractPagesMenuItem({onClick}: MenuItemArgs) {
  const mode: PanelMode = useContext(PanelContext)
  if (mode == "main") {
    return (
      <Menu.Item
        onClick={onClick}
        leftSection={<IconArrowRight style={ICON_CSS} />}
      >
        Extract Pages
      </Menu.Item>
    )
  }

  return (
    <Menu.Item
      onClick={onClick}
      leftSection={<IconArrowLeft style={ICON_CSS} />}
    >
      Extract Pages
    </Menu.Item>
  )
}
