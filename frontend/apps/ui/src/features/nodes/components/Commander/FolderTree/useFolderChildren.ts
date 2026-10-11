import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {apiSliceWithNodes} from "@/features/nodes/storage/api"
import type {FolderDocuments, FolderTreeItem} from "@/features/nodes/types"
import {useEffect, useMemo} from "react"
import {shallowEqual} from "react-redux"

const {getFolderChildren, getFolderDocuments} = apiSliceWithNodes.endpoints

interface FolderChildren {
  folders: Map<string, FolderTreeItem[]>
  documents: Map<string, FolderDocuments>
}

/**
 * Keeps cache subscriptions for the child folders (and, optionally, the
 * documents) of `parentIDs` and returns the loaded lists keyed by parent ID.
 * Cache invalidation (moves, renames, uploads, new folders) therefore
 * refreshes the tree automatically.
 */
export default function useFolderChildren(
  parentIDs: string[],
  withDocuments: boolean
): FolderChildren {
  const dispatch = useAppDispatch()
  const parentIDsKey = parentIDs.join(",")

  useEffect(() => {
    if (!parentIDsKey) {
      return
    }
    const ids = parentIDsKey.split(",")
    const subscriptions = [
      ...ids.map(id => dispatch(getFolderChildren.initiate(id))),
      ...(withDocuments
        ? ids.map(id => dispatch(getFolderDocuments.initiate(id)))
        : [])
    ]
    return () => subscriptions.forEach(s => s.unsubscribe())
  }, [dispatch, parentIDsKey, withDocuments])

  const folderLists = useAppSelector(
    state => parentIDs.map(id => getFolderChildren.select(id)(state).data),
    shallowEqual
  )
  const documentLists = useAppSelector(
    state =>
      withDocuments
        ? parentIDs.map(id => getFolderDocuments.select(id)(state).data)
        : [],
    shallowEqual
  )

  return useMemo(() => {
    const folders = new Map<string, FolderTreeItem[]>()
    const documents = new Map<string, FolderDocuments>()
    parentIDsKey.split(",").forEach((id, index) => {
      if (!id) {
        return
      }
      const folderList = folderLists[index]
      if (folderList) {
        folders.set(id, folderList)
      }
      const documentList = documentLists[index]
      if (documentList) {
        documents.set(id, documentList)
      }
    })
    return {folders, documents}
  }, [parentIDsKey, folderLists, documentLists])
}
