import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useApplyPageOpChangesMutation} from "@/features/document/apiSlice"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {selectCurrentDocVerID, selectCurrentNodeID} from "@/features/ui/uiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import type {Coord, PanelMode} from "@/types"
import {Box, Menu, rem} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {
  IconArrowBackUp,
  IconArrowMoveDown,
  IconEdit,
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
import RotateButton from "./RotateButton"
import RotateCCButton from "./RotateCCButton"

interface Args {
  opened: boolean
  onChange: (opened: boolean) => void
  position: Coord
}

const DELETE_DOCUMENT_TEXT =
  "Are you sure you want to delete entire document with all its versions?"

export default function ContextMenu({position, opened, onChange}: Args) {
  const dispatch = useAppDispatch()
  const [delDocOpened, {open: delDocOpen, close: delDocClose}] =
    useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const refEditTitleButton = useRef<HTMLButtonElement>(null)
  const refRotateButton = useRef<HTMLButtonElement>(null)
  const refRotateCCButton = useRef<HTMLButtonElement>(null)
  const refDeletePagesButton = useRef<HTMLButtonElement>(null)
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const [applyPageOpChanges] = useApplyPageOpChangesMutation()
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []

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

  const onResetPagesChanges = () => {
    dispatch(pagesReseted(docVerID!))
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
            leftSection={<IconEdit style={{width: rem(14), height: rem(14)}} />}
          >
            Change title
          </Menu.Item>
          {selectedPages.length > 0 && (
            <Menu.Item
              onClick={onRotateCC}
              leftSection={
                <IconRotateClockwise
                  style={{width: rem(14), height: rem(14)}}
                />
              }
            >
              Rotate clockwise
            </Menu.Item>
          )}
          {selectedPages.length > 0 && (
            <Menu.Item
              onClick={onRotate}
              leftSection={
                <IconRotate style={{width: rem(14), height: rem(14)}} />
              }
            >
              Rotate counter-clockwise
            </Menu.Item>
          )}
          {pagesHaveChanged && (
            <Menu.Item
              onClick={onResetPagesChanges}
              leftSection={
                <IconArrowBackUp style={{width: rem(14), height: rem(14)}} />
              }
            >
              Reset changes
            </Menu.Item>
          )}
          {pagesHaveChanged && (
            <Menu.Item
              onClick={onApplyPagesOpChanges}
              leftSection={
                <IconArrowMoveDown style={{width: rem(14), height: rem(14)}} />
              }
            >
              Save changes
            </Menu.Item>
          )}
          {selectedPages.length > 0 && (
            <Menu.Item
              onClick={onDeletePages}
              color="red"
              leftSection={
                <IconTrash style={{width: rem(14), height: rem(14)}} />
              }
            >
              Delete pages
            </Menu.Item>
          )}

          <Menu.Label>Danger zone</Menu.Label>
          <Menu.Item
            onClick={onDeleteDocument}
            color="red"
            leftSection={<IconX style={{width: rem(14), height: rem(14)}} />}
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
    </>
  )
}
