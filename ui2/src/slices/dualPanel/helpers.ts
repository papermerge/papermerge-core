import type {DocumentVersion, PageType, PanelMode} from "@/types"
import {DualPanelState} from "./types"

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
