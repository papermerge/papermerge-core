import {Box} from "@mantine/core"
import {useCallback, useEffect, useRef, useState} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectMainPanelWidth,
  setMainPanelWidth
} from "@/features/ui/panelRegistry"

import classes from "./PanelResizer.module.css"

// Minimum panel width as percentage
const MIN_PANEL_WIDTH_PERCENT = 20
const MAX_PANEL_WIDTH_PERCENT = 80

export default function PanelResizer() {
  const dispatch = useAppDispatch()
  const mainPanelWidth = useAppSelector(selectMainPanelWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLElement | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    // Get the parent container (main.main-content)
    containerRef.current = (e.target as HTMLElement).closest(
      "main.main-content"
    )
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      // Calculate the new width as a percentage
      const mouseX = e.clientX - containerRect.left
      let newWidthPercent = (mouseX / containerWidth) * 100

      // Clamp to min/max
      newWidthPercent = Math.max(
        MIN_PANEL_WIDTH_PERCENT,
        Math.min(MAX_PANEL_WIDTH_PERCENT, newWidthPercent)
      )

      dispatch(setMainPanelWidth(newWidthPercent))
    },
    [isDragging, dispatch]
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
      aria-valuenow={mainPanelWidth}
      aria-valuemin={MIN_PANEL_WIDTH_PERCENT}
      aria-valuemax={MAX_PANEL_WIDTH_PERCENT}
      tabIndex={0}
    />
  )
}
