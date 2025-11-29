import {useAppSelector} from "@/app/hooks"
import {selectSmallImageByPageId} from "@/features/document/store/selectors"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {selectDraggedPages} from "@/features/ui/uiSlice"
import type {UUID} from "@/types.d/common"
import {RefObject, useEffect, useRef, useState} from "react"

interface ThumbnailState {
  ref: RefObject<HTMLImageElement | null>
  imageURL: string | undefined
  isLoading: boolean
  isDragged: boolean
  checked: boolean
  withBorderBottom: boolean
  withBorderTop: boolean
  draggedPagesIDs?: UUID[]
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  clearBorderBottom: () => void
  clearBorderTop: () => void
}

export default function useThumbnail(pageID: UUID): ThumbnailState {
  const {panelId} = usePanel()
  const [isDragged, setIsDragged] = useState<boolean>(false)
  const [checked, setChecked] = useState<boolean>(false)
  const [withBorderBottom, setWithBorderBottom] = useState<boolean>(false)
  const [withBorderTop, setWithBorderTop] = useState<boolean>(false)
  const ref = useRef<HTMLImageElement>(null)
  const draggedPages = useAppSelector(selectDraggedPages)
  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const draggedPagesIDs = draggedPages?.map(p => p.id)
  const imageURL = useAppSelector(s => selectSmallImageByPageId(s, pageID))

  useEffect(() => {
    const cur_page_is_being_dragged = draggedPages?.find(p => p.id == pageID)
    if (cur_page_is_being_dragged) {
      setIsDragged(true)
    } else {
      setIsDragged(false)
    }
  }, [draggedPages?.length])

  useEffect(() => {
    if (selectedIds && selectedIds.includes(pageID)) {
      setChecked(true)
    } else {
      setChecked(false)
    }
  }, [selectedIds])

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const y = event.clientY

    event.preventDefault()

    if (ref?.current) {
      const rect = ref?.current.getBoundingClientRect()
      const half = (rect.bottom - rect.top) / 2

      if (y >= rect.top && y < rect.top + half) {
        // remove borderline_bottom and add borderline_top
        setWithBorderTop(true)
        setWithBorderBottom(false)
      } else if (y >= rect.top + half && y < rect.bottom) {
        // remove borderline_top and add borderline_bottom
        setWithBorderTop(false)
        setWithBorderBottom(true)
      }
    } // if (ref?.current)
  } // end of onLocalDragOver

  const onDragLeave = () => {
    // remove both borderline_bottom and borderline_top
    setWithBorderBottom(false)
    setWithBorderTop(false)
  }

  const clearBorderBottom = () => {
    setWithBorderBottom(false)
  }

  const clearBorderTop = () => {
    setWithBorderTop(false)
  }

  return {
    ref: ref,
    isLoading: !imageURL,
    imageURL: imageURL,
    isDragged,
    checked,
    withBorderBottom,
    withBorderTop,
    draggedPagesIDs,
    clearBorderBottom,
    clearBorderTop,
    onDragOver,
    onDragLeave
  }
}
