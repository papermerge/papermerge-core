import {HIDDEN} from "@/cconstants"
import type {Coord} from "@/types"
import {useDisclosure} from "@mantine/hooks"
import {RefObject, useCallback, useEffect, useState} from "react"

interface Args {
  ref: RefObject<HTMLDivElement | null>
}

interface ReturnType {
  opened: boolean
  options: {
    open: () => void
    close: () => void
  }
  position: Coord
}

export default function useContextMenu({ref}: Args): ReturnType {
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const [opened, {open, close}] = useDisclosure()

  const onContextMenu = useCallback(
    (ev: MouseEvent) => {
      ev.preventDefault() // prevents default context menu

      let new_y = ev.clientY
      let new_x = ev.clientX
      setContextMenuPosition({y: new_y, x: new_x})
      open()
    },
    [open]
  )
  useEffect(() => {
    /* ref.current may be null when the hook runs,
     * so addEventListener won’t work unless we wait until the element
     * appears in the DOM. This code uses a MutationObserver to detect when
     * DOM nodes are added — and attaches the listener as soon
     * as ref.current becomes available.
     */
    const observer = new MutationObserver(() => {
      const el = ref.current
      if (!el) return
      el.addEventListener("contextmenu", onContextMenu)
      observer.disconnect() // only once
    })

    if (ref.current) {
      ref.current.addEventListener("contextmenu", onContextMenu)
    } else {
      // listen for entire document.body DOM changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      const el = ref.current
      if (el) {
        el.removeEventListener("contextmenu", onContextMenu)
      }
      observer.disconnect()
    }
  }, [ref, onContextMenu])

  useEffect(() => {
    const handleClick = () => {
      if (opened) {
        close()
        setContextMenuPosition(HIDDEN)
      }
    }

    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [opened, close])

  return {
    opened,
    options: {open, close},
    position: contextMenuPosition
  }
}
