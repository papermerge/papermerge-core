import {useAppDispatch, useAppSelector} from "@/app/hooks"
import DropNodesModal from "@/features/nodes/components/Commander/NodesCommander/DropNodesDialog"
import {apiSliceWithNodes} from "@/features/nodes/storage/api"
import {
  selectDraggedNodeIDs,
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID
} from "@/features/ui/uiSlice"
import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"
import useHomeFolder from "@/hooks/useHomeFolder"
import useInboxFolder from "@/hooks/useInboxFolder"
import type {BreadcrumbType, NType, NodeType} from "@/types"
import {equalUUIDs} from "@/utils"
import type {TreeDragDropPayload, TreeNodeData} from "@mantine/core"
import {Group, Tree, useTree} from "@mantine/core"
import {
  IconDots,
  IconFile,
  IconFolder,
  IconFolderShare,
  IconInbox
} from "@tabler/icons-react"
import {useCallback, useEffect, useMemo, useState} from "react"
import {useTranslation} from "react-i18next"

import classes from "./FolderTree.module.css"
import type {TreeItemKind, TreeItemProps} from "./FolderTreeLabel"
import FolderTreeLabel from "./FolderTreeLabel"
import ShowDocumentsToggle, {
  useFolderTreeShowDocuments
} from "./ShowDocumentsToggle"
import useFolderChildren from "./useFolderChildren"
import {isNodeDrag, isTreeNodeDrag} from "./utils"

type TreeExpandedState = Record<string, boolean>

interface TreeItem extends TreeItemProps {
  id: string
}

const MORE_SUFFIX = ":more"

interface PendingMove {
  sourceNodes: Pick<NodeType, "id" | "title">[]
  sourceFolderID: string
  target: {id: string; title: string}
}

interface Args {
  currentFolderID?: string
  // the document open in the viewer; highlighted instead of its folder
  currentDocumentID?: string
  breadcrumb?: BreadcrumbType
  onNavigate: (node: NType) => void
}

export default function FolderTree({
  currentFolderID,
  currentDocumentID,
  breadcrumb,
  onNavigate
}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const home = useHomeFolder()
  const inbox = useInboxFolder()
  const {data: groupHomes} = useGetUserGroupHomesQuery()
  const {data: groupInboxes} = useGetUserGroupInboxesQuery()
  const draggedNodeIDs = useAppSelector(selectDraggedNodeIDs)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )
  const [loadedIDs, setLoadedIDs] = useState<string[]>([])
  const [expandedState, setExpandedState] = useState<TreeExpandedState>({})
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [showDocuments] = useFolderTreeShowDocuments()
  const children = useFolderChildren(loadedIDs, showDocuments)
  const moreLabel = t("nodes.folderTree.moreDocuments", {
    defaultValue: "Show all documents…"
  })

  const roots = useMemo<TreeItem[]>(() => {
    const filesLabel = t("common.files", {defaultValue: "Files"})
    const inboxLabel = t("common.inbox", {defaultValue: "Inbox"})
    const personal: TreeItem[] = []
    if (home) {
      personal.push({
        id: home.id,
        kind: "folder",
        title: home.label,
        icon: home.icon
      })
    }
    if (inbox) {
      personal.push({
        id: inbox.id,
        kind: "folder",
        title: inbox.label,
        icon: inbox.icon
      })
    }
    const group: TreeItem[] = [
      ...(groupHomes ?? []).map(h => ({
        id: h.home_id,
        kind: "folder" as const,
        title: h.group_name,
        description: filesLabel,
        icon: IconFolder
      })),
      ...(groupInboxes ?? []).map(i => ({
        id: i.inbox_id,
        kind: "folder" as const,
        title: i.group_name,
        description: inboxLabel,
        icon: IconInbox
      }))
    ]
    if (group.length > 0) {
      group[0] = {...group[0], startsGroupSection: true}
    }
    return [...personal, ...group]
  }, [home, inbox, groupHomes, groupInboxes, t])

  // `parentOf` maps each item to its parent folder (null for roots)
  const {data, parentOf, titleOf, kindOf} = useMemo(() => {
    const parentOf = new Map<string, string | null>()
    const titleOf = new Map<string, string>()
    const kindOf = new Map<string, TreeItemKind>()

    // undefined until the folder's subfolders are loaded
    const childItemsOf = (folderID: string): TreeItem[] | undefined => {
      const folders = children.folders.get(folderID)
      if (!folders) {
        return undefined
      }
      const items: TreeItem[] = folders.map(f => ({
        id: f.id,
        kind: "folder",
        title: f.title,
        icon: f.is_shared ? IconFolderShare : IconFolder
      }))
      const documents = showDocuments
        ? children.documents.get(folderID)
        : undefined
      if (documents) {
        items.push(
          ...documents.items.map(d => ({
            id: d.id,
            kind: "document" as const,
            title: d.title,
            icon: IconFile
          }))
        )
        if (documents.hasMore) {
          items.push({
            id: `${folderID}${MORE_SUFFIX}`,
            kind: "more",
            title: moreLabel,
            icon: IconDots
          })
        }
      }
      return items
    }

    const toNode = (item: TreeItem, parentID: string | null): TreeNodeData => {
      const {id, ...nodeProps} = item
      parentOf.set(id, parentID)
      titleOf.set(id, item.title)
      kindOf.set(id, item.kind)
      if (item.kind != "folder") {
        return {value: id, label: item.title, nodeProps}
      }
      return {
        value: id,
        label: item.title,
        // folders are always expandable so they accept "inside" drops;
        // loaded-but-empty folders render without a chevron
        hasChildren: true,
        nodeProps,
        children: childItemsOf(id)?.map(child => toNode(child, id))
      }
    }

    return {
      data: roots.map(root => toNode(root, null)),
      parentOf,
      titleOf,
      kindOf
    }
  }, [roots, children, showDocuments, moreLabel])

  const loadChildren = useCallback(
    async (folderID: string) => {
      setLoadedIDs(prev =>
        prev.includes(folderID) ? prev : [...prev, folderID]
      )
      await dispatch(
        apiSliceWithNodes.endpoints.getFolderChildren.initiate(folderID, {
          subscribe: false
        })
      ).unwrap()
    },
    [dispatch]
  )

  const selectedState = useMemo(() => {
    if (showDocuments && currentDocumentID) {
      return [currentDocumentID]
    }
    return currentFolderID ? [currentFolderID] : []
  }, [showDocuments, currentDocumentID, currentFolderID])

  const tree = useTree({
    expandedState,
    // Tree prunes state of nodes not (yet) in `data`; merging keeps nodes
    // expanded ahead of their parents being loaded
    onExpandedStateChange: next =>
      setExpandedState(prev => ({...prev, ...next})),
    selectedState,
    onLoadChildren: loadChildren
  })

  // reveal the current folder by loading and expanding all of its ancestors
  const ancestorsKey = (breadcrumb?.path ?? [])
    .slice(0, -1)
    .map(([id]) => id)
    .join(",")

  useEffect(() => {
    if (!ancestorsKey) {
      return
    }
    const ancestors = ancestorsKey.split(",")
    setLoadedIDs(prev => Array.from(new Set([...prev, ...ancestors])))
    setExpandedState(prev => {
      const next = {...prev}
      ancestors.forEach(id => (next[id] = true))
      return next
    })
  }, [ancestorsKey])

  const lineageOf = useCallback(
    (folderID: string): string[] => {
      const lineage: string[] = []
      let current: string | null | undefined = folderID
      while (current) {
        lineage.push(current)
        current = parentOf.get(current)
      }
      return lineage
    },
    [parentOf]
  )

  const canAcceptNodes = useCallback(
    (folderID: string): boolean => {
      if (!draggedNodeIDs || draggedNodeIDs.length == 0) {
        return false
      }
      if (
        draggedNodesSourceFolderID &&
        equalUUIDs(folderID, draggedNodesSourceFolderID)
      ) {
        return false
      }
      // a folder can't be moved into itself or into one of its descendants
      const lineage = lineageOf(folderID)
      return !draggedNodeIDs.some(nodeID =>
        lineage.some(id => equalUUIDs(id, nodeID))
      )
    },
    [draggedNodeIDs, draggedNodesSourceFolderID, lineageOf]
  )

  const onDropNodes = (folderID: string) => {
    if (!draggedNodesSourceFolderID || draggedNodes.length == 0) {
      return
    }
    setPendingMove({
      sourceNodes: draggedNodes,
      sourceFolderID: draggedNodesSourceFolderID,
      target: {id: folderID, title: titleOf.get(folderID) ?? ""}
    })
  }

  // children are sorted by title, so any drop position means "move into"
  const allowTreeDrop = ({draggedNode, targetNode}: TreeDragDropPayload) =>
    kindOf.get(targetNode) == "folder" &&
    kindOf.get(draggedNode) != "more" &&
    parentOf.get(draggedNode) !== targetNode

  const onTreeDrop = ({draggedNode, targetNode}: TreeDragDropPayload) => {
    const sourceFolderID = parentOf.get(draggedNode)
    if (!sourceFolderID) {
      return
    }
    setPendingMove({
      sourceNodes: [{id: draggedNode, title: titleOf.get(draggedNode) ?? ""}],
      sourceFolderID,
      target: {id: targetNode, title: titleOf.get(targetNode) ?? ""}
    })
  }

  const navigate = (
    value: string,
    event: React.MouseEvent | React.KeyboardEvent
  ) => {
    const kind = kindOf.get(value) ?? "folder"
    const target: NType =
      kind == "document"
        ? {id: value, ctype: "document"}
        : {id: kind == "more" ? parentOf.get(value)! : value, ctype: "folder"}
    if (event.ctrlKey || event.metaKey) {
      window.open(`/${target.ctype}/${target.id}`, "_blank")
      return
    }
    onNavigate(target)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key != "Enter") {
      return
    }
    const item = (event.target as HTMLElement).closest<HTMLElement>(
      "[role=treeitem]"
    )
    if (item?.dataset.value) {
      event.preventDefault()
      navigate(item.dataset.value, event)
    }
  }

  // drags not accepted by a tree item must not fall through to the
  // commander, which would move the nodes into the currently open folder
  const stopAppDrag = (event: React.DragEvent) => {
    if (isNodeDrag(event) || isTreeNodeDrag(event)) {
      event.stopPropagation()
    }
  }

  const closeMoveDialog = () => setPendingMove(null)

  return (
    <nav
      aria-label={t("nodes.folderTree.label", {defaultValue: "Folders"})}
      className={classes.tree}
      onDragEnter={stopAppDrag}
      onDragOver={stopAppDrag}
      onDrop={stopAppDrag}
    >
      <Group justify="flex-end" className={classes.header}>
        <ShowDocumentsToggle />
      </Group>
      <Tree
        data={data}
        tree={tree}
        levelOffset="md"
        withLines
        expandOnClick={false}
        expandOnSpace
        allowRangeSelection={false}
        allowDrop={allowTreeDrop}
        onDragDrop={onTreeDrop}
        onKeyDown={onKeyDown}
        renderNode={payload => (
          <FolderTreeLabel
            payload={payload}
            canAcceptNodes={canAcceptNodes}
            onNavigate={navigate}
            onDropNodes={onDropNodes}
          />
        )}
      />
      {pendingMove && (
        <DropNodesModal
          opened
          sourceNodes={pendingMove.sourceNodes}
          sourceFolderID={pendingMove.sourceFolderID}
          targetFolder={pendingMove.target}
          onSubmit={closeMoveDialog}
          onCancel={closeMoveDialog}
        />
      )}
    </nav>
  )
}
