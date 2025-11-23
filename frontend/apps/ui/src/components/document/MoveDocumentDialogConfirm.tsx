import {useAppSelector} from "@/app/hooks"
import Error from "@/components/Error"
import {useGetDocumentQuery} from "@/features/document/store/apiSlice"
import {
  useGetFolderQuery,
  useMoveNodesMutation
} from "@/features/nodes/storage/api"
import {
  selectCurrentNodeID,
  selectPanelComponent
} from "@/features/ui/panelRegistry"
import {otherPanel} from "@/utils"
import {Button, Group, Loader, Modal, Text} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {useState} from "react"

import {usePanel} from "@/features/ui/hooks/usePanel"

interface Args {
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
  text?: string
}

export default function MoveDocumentDialogConfirm({
  opened,
  onCancel,
  onSubmit
}: Args) {
  /* Modal dialog to confirm the moving of the document to
    the current folder of the other panel.

   This dialog is opened from the viewer.
   When dialog is opened other panel is assumed be opened and to be commander.
    */
  const [error, setError] = useState("")
  const {panelId} = usePanel()
  /* in source panel current node is a document */
  const docID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const component = useAppSelector(s => selectPanelComponent(s, panelId))
  const {currentData: doc} = useGetDocumentQuery(docID!)
  const other = otherPanel(panelId)
  /* in other panel current node is folder */
  const currentNode = useAppSelector(s => selectCurrentNode(s, other))
  const folderID =
    currentNode?.id && component == "commander" ? currentNode.id : undefined
  const {data: targetFolder} = useGetFolderQuery(folderID ?? skipToken)
  const [moveDocument, {isLoading}] = useMoveNodesMutation()

  const onMoveDocument = async () => {
    const data = {
      body: {
        source_ids: [docID!],
        target_id: folderID!
      },
      sourceFolderID: doc?.parent_id!
    }
    try {
      await moveDocument(data)
      onSubmit()
      reset()
    } catch (error: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const reset = () => {
    setError("")
  }

  return (
    doc &&
    targetFolder && (
      <Modal title={"Move Document"} opened={opened} onClose={onCancel}>
        Move document
        <Text c="green" span>
          {" "}
          {doc.title}{" "}
        </Text>
        to folder{" "}
        <Text c="blue" span>
          {targetFolder.title}
        </Text>
        ?{error && <Error message={error} />}
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onCancel}>
            No
          </Button>
          <Group>
            {isLoading && <Loader size="sm" />}
            <Button disabled={isLoading} onClick={onMoveDocument}>
              Yes
            </Button>
          </Group>
        </Group>
      </Modal>
    )
  )
}
