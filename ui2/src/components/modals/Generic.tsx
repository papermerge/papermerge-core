import {createRoot} from "react-dom/client"
import {useEffect, useState, useRef} from "react"
import {Provider} from "react-redux"
import React from "react"
import theme from "@/themes"
import {store} from "@/app/store"

import {
  Button,
  Modal,
  Container,
  Group,
  Space,
  MantineProvider,
  Loader
} from "@mantine/core"

type Args = {
  children: React.ReactNode
  modal_title: string
  submit_button_title?: string
  submit_button_variant?: string
  onCancel: () => void
  onSubmit: (signal: AbortSignal) => Promise<boolean>
  size?: string
  submit_button_color?: string
}

const GenericModal = ({
  children,
  modal_title,
  submit_button_title,
  submit_button_variant,
  submit_button_color,
  onCancel,
  onSubmit,
  size
}: Args) => {
  const [show, setShow] = useState<boolean>(true)
  const [inProgress, setInProgress] = useState<boolean>(false)
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
    const closeMe = (await onSubmit(controller.signal)) as boolean
    if (closeMe) {
      setInProgress(false)
      setShow(false)
      return
    }
    setInProgress(false)
  }

  const handleCancel = () => {
    controller.abort()
    onCancel()
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
    <Modal title={modal_title} opened={show} onClose={handleCancel} size={size}>
      <Container>
        {children}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            leftSection={inProgress && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={inProgress}
            color={submit_button_color || "pmg.9"}
          >
            {submit_button_title || "Submit"}
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}

export default GenericModal

export function openModal<YieldT, PropsT>(Component: any, props?: PropsT) {
  const elemDiv = document.createElement("div")

  if (!elemDiv) {
    throw Error("There was an error creating div element for openModal")
  }

  const promise = new Promise<YieldT>(function (onOK, onCancel) {
    const domRoot = createRoot(elemDiv)
    domRoot.render(
      <MantineProvider theme={theme}>
        <Provider store={store}>
          <Component onOK={onOK} onCancel={onCancel} {...props} />
        </Provider>
      </MantineProvider>
    )
  })

  return promise
}
