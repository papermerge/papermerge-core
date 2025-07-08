import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"
import {selectAllPages} from "@/features/document/store/documentVersSlice"
import type {PanelMode} from "@/types"
import {Button, Group, Modal} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"
interface Args {
  opened: boolean
  onClose: () => void
}

export const PageOCRDialog = ({onClose, opened}: Args) => {
  /* Show OCRed text of one or multiple pages */
  const ref = useRef<HTMLButtonElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const {docVer} = useCurrentDocVer()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})
  const pages = useAppSelector(s => selectAllPages(s, docVer?.id)) || []

  useEffect(() => {
    // handle "enter" keyboard press
    document.addEventListener("keydown", handleKeydown, false)

    return () => {
      document.removeEventListener("keydown", handleKeydown, false)
    }
  }, [])

  const ocrText = () => {
    let result = ""
    if (selectedPages.length > 0) {
      result = selectedPages.map(p => p.text).join(" ")
    } else {
      result = pages.map(p => p.text).join(" ")
    }
    return result
  }

  const handleKeydown = async (e: KeyboardEvent) => {
    switch (e.code) {
      case "Enter":
        /*
         * The intuitive code here would be:
         *```
         * await onLocalSubmit()
         *```
         * However, the `await onLocalSubmit()` code will submit only
         * initial value of the `title` field. Is that because of
         * useEffect / addEventListener / react magic ?
         */
        if (ref.current) {
          ref.current.click()
        }
        break
    }
  }

  const onLocalClose = () => {
    onClose()
  }

  return (
    <Modal title={"OCR Text"} size="xl" opened={opened} onClose={onLocalClose}>
      {ocrText()}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalClose}>
          Close
        </Button>
      </Group>
    </Modal>
  )
}

export default PageOCRDialog
