import {useEffect, useState, useRef} from "react"
import React from "react"

import {Button, Modal, Container, Group, Space} from "@mantine/core"

type Args = {
  children: React.ReactNode
  modal_title: string
  submit_button_title?: string
  submit_button_variant?: string
  onCancel: () => void
  onSubmit: (signal: AbortSignal) => void
}

const GenericModal = ({
  children,
  modal_title,
  submit_button_title,
  submit_button_variant,
  onCancel,
  onSubmit
}: Args) => {
  const [show, setShow] = useState<boolean>(true)
  const [inProgress, setInProgress] = useState(false)
  const [controller, setController] = useState<AbortController>(
    new AbortController()
  )
  const ref_ok = useRef<HTMLButtonElement>(null)
  const ref_cancel = useRef<HTMLButtonElement>(null)

  if (!submit_button_variant) {
    submit_button_variant = "primary"
  }

  if (!controller) {
    setController(new AbortController())
  }

  const handleSubmit = async () => {
    setInProgress(true)

    await onSubmit(controller.signal)

    setInProgress(false)
    setShow(false)
  }

  const handleCancel = () => {
    controller.abort()

    onCancel()

    setInProgress(false)
    setShow(false)
    setController(new AbortController())
  }

  const handleKeydown = (e: KeyboardEvent) => {
    /* handle enter/esc keyboard press by simulating
    clicks on actual OK/Cancel buttons */
    switch (e.code) {
      case "Enter":
        if (ref_ok.current) {
          ref_ok.current.click()
        }
        break
      case "Escape":
        if (ref_cancel.current) {
          ref_cancel.current.click()
        }
        break
    }
  }

  useEffect(() => {
    // handle enter/esc keyboard press
    document.addEventListener("keydown", handleKeydown, false)

    return () => {
      document.removeEventListener("keydown", handleKeydown, false)
    }
  }, [])

  return (
    <Modal title={modal_title} opened={show} onClose={() => {}}>
      <Container>
        {children}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{submit_button_title}</Button>
        </Group>
      </Container>
    </Modal>
  )
}

export default GenericModal
