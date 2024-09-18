import Error from "@/components/Error"
import PanelContext from "@/contexts/PanelContext"
import {useMovePagesMutation} from "@/features/document/apiSlice"
import {Button, ComboboxItem, Group, Loader, Modal, Select} from "@mantine/core"
import {useContext, useState} from "react"

import type {DocumentType, PanelMode, TransferStrategyType} from "@/types"

interface Args {
  sourceDocID?: string
  targetDoc?: DocumentType
  sourcePageIDs?: string[]
  targetPageID: string
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
}

export default function TransferPagesModal({
  opened,
  onCancel,
  onSubmit,
  sourceDocID,
  targetDoc,
  targetPageID,
  sourcePageIDs
}: Args) {
  const [value, setValue] = useState<ComboboxItem | null>(null)
  const [error, setError] = useState("")
  const mode: PanelMode = useContext(PanelContext)
  const [movePages, {isLoading}] = useMovePagesMutation()

  if (!sourceDocID) {
    return <></>
  }

  if (!targetDoc) {
    return <></>
  }

  if (!sourcePageIDs || sourcePageIDs.length == 0) {
    console.warn("Missing source page IDs")
    return <></>
  }

  const onTransferPages = async () => {
    const transferStrategy = (value?.value || "mix") as TransferStrategyType
    const data = {
      body: {
        source_page_ids: sourcePageIDs,
        target_page_id: targetPageID,
        move_strategy: transferStrategy
      },
      sourceDocID: sourceDocID,
      targetDocID: targetDoc.id
    }
    try {
      await movePages(data)
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
    <Modal title={"Transfer Selected Pages"} opened={opened} onClose={onCancel}>
      Do you want to transfer selected pages to
      {targetDoc.title}?
      <Select
        data={[
          {value: "mix", label: "Mix"},
          {value: "replace", label: "Replace"}
        ]}
        label="Strategy"
        value={value ? value.value : "mix"}
        onChange={(_value, option) => setValue(option)}
      />
      {error && <Error message={error} />}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onTransferPages}>
            Yes, transfer
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
