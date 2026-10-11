import {useAppDispatch} from "@/app/hooks"
import {dragEnded} from "@/features/ui/uiSlice"
import type {SpecialFolderType} from "@/types"
import type {RenderTreeNodePayload} from "@mantine/core"
import {ActionIcon, Text} from "@mantine/core"
import {IconChevronDown, IconChevronRight} from "@tabler/icons-react"
import clsx from "clsx"
import {useEffect, useRef} from "react"
import {useTranslation} from "react-i18next"

import classes from "./FolderTree.module.css"
import {isNodeDrag, isTreeNodeDrag, TREE_NODE_KEY} from "./utils"

// how long a dragged item must hover a collapsed folder before it expands
const HOVER_EXPAND_DELAY_MS = 700

// "more" stands for the documents of a folder that were not fetched
export type TreeItemKind = "folder" | "document" | "more"

export interface TreeItemProps {
  kind: TreeItemKind
  title: string
  icon: SpecialFolderType["icon"]
  description?: string
  startsGroupSection?: boolean
}

interface Args {
  payload: RenderTreeNodePayload
  // whether nodes dragged from the commander may be dropped on this folder
  canAcceptNodes: (folderID: string) => boolean
  onNavigate: (value: string, event: React.MouseEvent) => void
  onDropNodes: (folderID: string) => void
}

export default function FolderTreeLabel({
  payload,
  canAcceptNodes,
  onNavigate,
  onDropNodes
}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const {node, tree, expanded, isRoot, loadError, elementProps} = payload
  const {
    kind,
    title,
    icon: Icon,
    description,
    startsGroupSection
  } = node.nodeProps as TreeItemProps
  const value = node.value
  const isFolder = kind == "folder"
  const isEmpty = Array.isArray(node.children) && node.children.length == 0
  const expandTimer = useRef<number | undefined>(undefined)

  const clearExpandTimer = () => {
    window.clearTimeout(expandTimer.current)
    expandTimer.current = undefined
  }

  useEffect(() => clearExpandTimer, [])

  const startExpandTimer = () => {
    if (!isFolder || expanded || isEmpty || expandTimer.current !== undefined) {
      return
    }
    expandTimer.current = window.setTimeout(() => {
      expandTimer.current = undefined
      tree.expand(value)
    }, HOVER_EXPAND_DELAY_MS)
  }

  const acceptsNodes = () => isFolder && canAcceptNodes(value)

  const setDropHighlight = (target: HTMLElement, on: boolean) => {
    if (on) {
      target.setAttribute("data-drag-over", "inside")
    } else {
      target.removeAttribute("data-drag-over")
    }
  }

  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    elementProps.onDragStart?.(event)
    event.dataTransfer.setData(TREE_NODE_KEY, value)
    // a drag from the tree must not be mistaken for a stale commander drag
    dispatch(dragEnded())
  }

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (isTreeNodeDrag(event)) {
      startExpandTimer()
      return
    }
    if (!isNodeDrag(event)) {
      return
    }
    event.stopPropagation()
    if (!acceptsNodes()) {
      return
    }
    event.preventDefault()
    setDropHighlight(event.currentTarget, true)
    startExpandTimer()
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isNodeDrag(event)) {
      elementProps.onDragOver?.(event)
      return
    }
    event.stopPropagation()
    if (!acceptsNodes()) {
      event.dataTransfer.dropEffect = "none"
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropHighlight(event.currentTarget, true)
  }

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    elementProps.onDragLeave?.(event)
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    setDropHighlight(event.currentTarget, false)
    clearExpandTimer()
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    clearExpandTimer()
    if (!isNodeDrag(event)) {
      elementProps.onDrop?.(event)
      return
    }
    event.preventDefault()
    event.stopPropagation()
    setDropHighlight(event.currentTarget, false)
    if (acceptsNodes()) {
      onDropNodes(value)
    }
  }

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    elementProps.onClick(event)
    onNavigate(value, event)
  }

  const onChevronClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    tree.toggleExpanded(value)
  }

  return (
    <div
      {...elementProps}
      className={clsx(
        elementProps.className,
        classes.label,
        kind == "more" && classes.more,
        startsGroupSection && classes.groupSection
      )}
      title={title}
      draggable={!isRoot && kind != "more" && elementProps.draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!isFolder || isEmpty ? (
        <span className={classes.chevronPlaceholder} />
      ) : (
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          tabIndex={-1}
          aria-hidden
          draggable={false}
          onClick={onChevronClick}
        >
          {expanded ? (
            <IconChevronDown size={14} />
          ) : (
            <IconChevronRight size={14} />
          )}
        </ActionIcon>
      )}
      <span className={classes.icon}>
        <Icon size={16} stroke={1.5} />
      </span>
      <Text size="sm" inherit truncate className={classes.title}>
        {title}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" className={classes.description}>
          {description}
        </Text>
      )}
      {loadError && (
        <Text size="xs" c="red" className={classes.description}>
          {t("nodes.folderTree.loadError", {
            defaultValue: "Could not load folders"
          })}
        </Text>
      )}
    </div>
  )
}
