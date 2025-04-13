import {Button, Container, Group, Loader, Modal} from "@mantine/core"
import {useState} from "react"

import {useScheduleOCRProcessMutation} from "@/features/tasks/apiSlice"

import ScheduleOCRProcess from "@/components/ScheduleOCRProcess"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import type {OCRCode} from "@/types"
import {notifications} from "@mantine/notifications"

type Args = {
  opened: boolean
  node_id: string
  onSubmit: () => void
  onCancel: () => void
}

export const RunOCRModal = ({node_id, onSubmit, onCancel, opened}: Args) => {
  const runtimeConfig = useRuntimeConfig()
  const [lang, setLang] = useState<OCRCode>("deu")
  const [scheduleOCRProcess] = useScheduleOCRProcessMutation()

  const onLangChange = (newLang: OCRCode) => {
    setLang(newLang)
  }

  const localSubmit = async () => {
    await scheduleOCRProcess({document_id: node_id, lang: lang})
    notifications.show({
      withBorder: true,
      message: `Document ${node_id} scheduled for processing`,
      autoClose: 7000
    })
    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  return (
    <Modal
      title="Schedule OCR Processing"
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        OCR processing will be performed in background. You will need to refresh
        current document to see the outcome.
        <ScheduleOCRProcess
          defaultLang={runtimeConfig.ocr__default_lang_code}
          onLangChange={onLangChange}
        />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={false}
          >
            Process
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
