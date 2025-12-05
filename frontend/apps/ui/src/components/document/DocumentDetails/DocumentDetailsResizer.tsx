import {Box} from "@mantine/core"
import {useCallback, useEffect, useRef, useState} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelAllCustom,
  setPanelCustomState
} from "@/features/ui/panelRegistry"

import classes from "./DocumentDetailsResizer.module.css"

// Min/max width as percentage of the .inner container
const MIN_WIDTH_PERCENT = 15
const MAX_WIDTH_PERCENT = 50
const DEFAULT_WIDTH_PERCENT = 25

export default function DocumentDetailsResizer() {
  const dispatch = useAppDispatch()
  const {panelId} = usePanel()
  const {documentDetailsWidth} = useAppSelector(s =>
    selectPanelAllCustom(s, panelId)
  )
  const currentWidth = documentDetailsWidth ?? DEFAULT_WIDTH_PERCENT

  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLElement | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    // Get the parent .inner container
    containerRef.current = (e.target as HTMLElement).closest(
      ".viewer-inner, [class*='inner']"
    ) as HTMLElement

    // Fallback: try to find by traversing up
    if (!containerRef.current) {
      let parent = (e.target as HTMLElement).parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        if (style.display === "flex" && style.flexDirection === "row") {
          containerRef.current = parent
          break
        }
        parent = parent.parentElement
      }
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      // Calculate position from the RIGHT edge (since DocumentDetails is on the right)
      const mouseX = e.clientX - containerRect.left
      const distanceFromRight = containerWidth - mouseX
      let newWidthPercent = (distanceFromRight / containerWidth) * 100

      // Clamp to min/max
      newWidthPercent = Math.max(
        MIN_WIDTH_PERCENT,
        Math.min(MAX_WIDTH_PERCENT, newWidthPercent)
      )

      dispatch(
        setPanelCustomState({
          panelId,
          key: "documentDetailsWidth",
          value: newWidthPercent
        })
      )
    },
    [isDragging, dispatch, panelId]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    containerRef.current = null
  }, [])

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      // Prevent text selection while dragging
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const isVisible = isHovered || isDragging

  return (
    <Box
      className={`${classes.resizer} ${isVisible ? classes.visible : ""} ${isDragging ? classes.dragging : ""}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={MIN_WIDTH_PERCENT}
      aria-valuemax={MAX_WIDTH_PERCENT}
      tabIndex={0}
    />
  )
}

export {DEFAULT_WIDTH_PERCENT as DOCUMENT_DETAILS_DEFAULT_WIDTH}
