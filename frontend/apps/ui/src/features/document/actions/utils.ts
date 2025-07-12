import type {RootState} from "@/app/types"
import type {DocumentVersion} from "@/features/document/types"
import {UUID} from "@/types.d/common"

export function getLastVersion(
  docVers?: DocumentVersion[]
): DocumentVersion | undefined {
  if (!docVers) {
    return undefined
  }

  if (docVers.length === 0) {
    return undefined
  }

  return docVers.reduce((latest, current) =>
    current.number > latest.number ? current : latest
  )
}

interface GetSourceOldPageID {
  docID: UUID
  movedOutPageIDs: UUID[]
  state: RootState
}

export function getSourceOrderedPageIDs({
  docID,
  movedOutPageIDs,
  state
}: GetSourceOldPageID): UUID[] {
  const docVerID = state.docs.entities[docID]?.latestDocVer?.docVerID
  if (!docVerID) {
    console.error(`getSourcePageID: docVerID=${docVerID}} not found`)
    return []
  }

  const pages = state.docVers.entities[docVerID].pages
  if (!pages) {
    console.error(`getSourcePageID: empty pages`)
    return []
  }

  const pagesSortedByNumber = pages.slice().sort((a, b) => a.number - b.number)
  const withoutMovedOutPages = pagesSortedByNumber.filter(
    p => !movedOutPageIDs.includes(p.id)
  )

  return withoutMovedOutPages.map(p => p.id)
}
