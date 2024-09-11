import type {
  ClientPage,
  DocumentVersion,
  DroppedThumbnailPosition,
  PageType,
  PanelMode
} from "@/types"
import {DualPanelState} from "./types"

export function dropThumbnailPageHelper({
  mode,
  state,
  sources,
  target,
  position
}: {
  mode: PanelMode
  state: DualPanelState
  sources: ClientPage[]
  target: ClientPage
  position: DroppedThumbnailPosition
}) {
  /*
  let pages: ClientPage[]
  let curVer
  if (mode == "main") {
    curVer = state.pages = state.mainPanel.viewer?.versions[curVer - 1].pages!
  } else {
    curVer = state.secondaryPanel!.viewer!.currentVersion!
    pages = state.secondaryPanel!.viewer?.versions[curVer - 1].pages!
  }
  const page_ids = pages.map(p => p.id)
  const source_ids = sources.map(p => p.id)
  if (contains_every({container: page_ids, items: source_ids})) {
    const new_pages = reorder_pages<ClientPage, string>({
      arr: pages,
      source_ids: source_ids,
      target_id: target.id,
      position: position,
      idf: (val: ClientPage) => val.id
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
    */
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
