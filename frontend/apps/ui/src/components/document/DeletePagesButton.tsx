import {forwardRef, useContext} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {PanelMode} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"

import {
  pagesDeleted,
  selectAllPages,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {
  selectCurrentDocVerID,
  viewerSelectionCleared
} from "@/features/ui/uiSlice"
import {selectCurrentUser} from "@/slices/currentUser"

import PanelContext from "@/contexts/PanelContext"
import DeleteEntireDocumentConfirm from "./DeleteEntireDocumentConfirm"

interface Args {
  hidden?: boolean
}

const DeleteButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden} = props
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const allPages = useAppSelector(s => selectAllPages(s, mode)) || []

  const onClick = () => {
    if (selectedPages.length == allPages.length) {
      /* Confirm that user intends to delete entire document */
      open()
    } else {
      dispatch(
        pagesDeleted({
          sources: selectedPages,
          targetDocVerID: docVerID!
        })
      )
      dispatch(viewerSelectionCleared(mode))
    }
  }

  const onCancel = () => {
    close()
  }

  const onSubmit = () => {
    /* User deleted entire document*/
    close()
    /* Redirect user back to commander */
    navigate(`/home/${user.home_folder_id}`)
  }

  return (
    <>
      <Tooltip withArrow label="Delete">
        <ActionIcon
          ref={ref}
          size="lg"
          onClick={onClick}
          color={"red"}
          style={hidden ? {display: "None"} : {}}
        >
          <IconTrash />
        </ActionIcon>
      </Tooltip>
      <DeleteEntireDocumentConfirm
        opened={opened}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </>
  )
})

export default DeleteButton
