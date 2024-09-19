import Error from "@/components/Error"
import {useMovePagesMutation} from "@/features/document/apiSlice"
import {Button, ComboboxItem, Group, Loader, Modal, Select} from "@mantine/core"
import {useState} from "react"

import type {DocumentType, ServerErrorType, TransferStrategyType} from "@/types"

interface Args {
  sourceDocID: string
  sourceDocParentID: string
  targetDoc: DocumentType
  sourcePageIDs: string[]
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
  sourceDocParentID,
  targetDoc,
  targetPageID,
  sourcePageIDs
}: Args) {
  const [value, setValue] = useState<ComboboxItem | null>(null)
  const [error, setError] = useState("")
  const [movePages, {isLoading}] = useMovePagesMutation()

  const onTransferPages = async () => {
    const transferStrategy = (value?.value || "mix") as TransferStrategyType
    const data = {
      body: {
        source_page_ids: sourcePageIDs,
        target_page_id: targetPageID,
        move_strategy: transferStrategy
      },
      sourceDocID: sourceDocID,
      sourceDocParentID: sourceDocParentID,
      targetDocID: targetDoc.id
    }
    try {
      await movePages(data)
      onSubmit()
      reset()
    } catch (e: unknown) {
      const err = e as ServerErrorType
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
