import type {
  CurrentNodeType,
  PanelMode,
  PageType,
  DroppedThumbnailPosition,
  DocumentVersion,
  PageAndRotOp
} from "@/types"
import {DualPanelState, Commander} from "./types"
import {INITIAL_PAGE_SIZE} from "@/cconstants"
import {contains_every} from "@/utils"
import {reorder as reorder_pages} from "@/utils"

export function selectionAddPageHelper(
  state: DualPanelState,
  pageId: string,
  mode: PanelMode
) {
  switch (mode) {
    case "main":
      if (state.mainPanel.viewer) {
        state.mainPanel.viewer.selectedIds.push(pageId)
      }
      break
    case "secondary":
      if (state.secondaryPanel?.viewer) {
        state.secondaryPanel.viewer.selectedIds.push(pageId)
      }
      break
    default:
      throw Error("Should never reach this place")
  }
}

export function selectionRemovePageHelper(
  state: DualPanelState,
  pageId: string,
  mode: PanelMode
) {
  if (mode == "main") {
    if (state.mainPanel.viewer) {
      const newSelectedIds = state.mainPanel.viewer.selectedIds.filter(
        i => i != pageId
      )
      state.mainPanel.viewer.selectedIds = newSelectedIds
    }
  }

  if (mode == "secondary") {
    if (state.secondaryPanel?.viewer) {
      const newSelectedIds = state.secondaryPanel.viewer.selectedIds.filter(
        i => i != pageId
      )
      state.secondaryPanel.viewer.selectedIds = newSelectedIds
    }
  }
}

export function commanderInitialState(node: CurrentNodeType | null): Commander {
  return {
    pagination: null,
    lastPageSize: INITIAL_PAGE_SIZE
  }
}

export function dropThumbnailPageHelper({
  mode,
  state,
  sources,
  target,
  position
}: {
  mode: PanelMode
  state: DualPanelState
  sources: PageAndRotOp[]
  target: PageAndRotOp
  position: DroppedThumbnailPosition
}) {
  let pages: PageAndRotOp[]
  let curVer
  if (mode == "main") {
    curVer = state.mainPanel.viewer!.currentVersion!
    pages = state.mainPanel.viewer?.versions[curVer - 1].pages!
  } else {
    curVer = state.secondaryPanel!.viewer!.currentVersion!
    pages = state.secondaryPanel!.viewer?.versions[curVer - 1].pages!
  }
  const page_ids = pages.map(p => p.page.id)
  const source_ids = sources.map(p => p.page.id)
  if (contains_every({container: page_ids, items: source_ids})) {
    /* Here we deal with page transfer is within the same document
      i.e we just reordering. It is so because all source pages (their IDs)
      were found in the target document version.
    */
    const new_pages = reorder_pages<PageAndRotOp, string>({
      arr: pages,
      source_ids: source_ids,
      target_id: target.page.id,
      position: position,
      idf: (val: PageAndRotOp) => val.page.id
    })
    if (mode == "main") {
      curVer = state.mainPanel.viewer!.currentVersion!
      if (
        state.mainPanel.viewer &&
        state.mainPanel.viewer.versions.length >= curVer &&
        state.mainPanel.viewer.versions[curVer - 1]
      ) {
        state.mainPanel.viewer.versions[curVer - 1].pages = new_pages
      }
    } else {
      curVer = state.secondaryPanel!.viewer!.currentVersion!
      if (
        curVer &&
        state.secondaryPanel &&
        state.secondaryPanel.viewer &&
        state.secondaryPanel.viewer.versions.length >= curVer &&
        state.secondaryPanel.viewer.versions[curVer - 1]
      ) {
        state.secondaryPanel.viewer.versions[curVer - 1].pages = new_pages
      }
    }
  }
}

export function resetPageChangesHelper(state: DualPanelState, mode: PanelMode) {
  let curVer

  if (mode == "main") {
    if (state.mainPanel.viewer) {
      curVer = state.mainPanel.viewer?.currentVersion
      if (curVer && curVer > 1) {
        state.mainPanel.viewer.versions[curVer - 1].pages =
          state.mainPanel.viewer.initialPages
      }
    }
  } else {
    if (state.secondaryPanel && state.secondaryPanel.viewer) {
      curVer = state.secondaryPanel.viewer.currentVersion
      if (curVer && curVer > 1) {
        state.secondaryPanel.viewer.versions[curVer - 1].pages =
          state.secondaryPanel.viewer.initialPages
      }
    }
  }
}

export function getLatestVersionPages(vers: DocumentVersion[]): PageType[] {
  const lastVer = vers.reduce((maxVer, v) => {
    if (maxVer.number > v.number) {
      return maxVer
    }
    return v
  }, vers[0])
  return lastVer.pages
}
