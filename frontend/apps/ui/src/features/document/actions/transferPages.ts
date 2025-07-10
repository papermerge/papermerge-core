import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/store/apiSlice" // make sure this exports your API slice
import {DocSliceEntity, upsertDoc} from "@/features/document/store/docsSlice"
import {addClientDocVersion} from "@/features/document/store/documentVersSlice"
import {addImageObjects} from "@/features/document/store/imageObjectsSlice"
import {DocumentVersion} from "@/features/document/types"
import {clientDVFromDV} from "@/features/document/utils"
import {currentDocVerUpdated} from "@/features/ui/uiSlice"
import type {MovePagesType, PanelMode} from "@/types"
import {TransferStrategyType} from "@/types"
import {UUID} from "@/types.d/common"
import {t} from "@/utils/i18nHelper"
import {notifications} from "@mantine/notifications"
import {createAsyncThunk} from "@reduxjs/toolkit"

export const transferPages = createAsyncThunk<
  void, // return type
  {movePagesData: MovePagesType; sourceMode: PanelMode}, // argument type
  {state: RootState} // thunkAPI config
>("document/transferPages", async (inputArgs, {dispatch, getState}) => {
  const state = getState()
  const sourcePageData = getSourceOrderedPageIDs({
    docID: inputArgs.movePagesData.sourceDocID,
    movedOutPageIDs: inputArgs.movePagesData.body.source_page_ids,
    state
  })
  const targetPageData = getTargetOrderedPageIDs({
    docID: inputArgs.movePagesData.targetDocID,
    movedInPageIDs: inputArgs.movePagesData.body.source_page_ids,
    strategy: inputArgs.movePagesData.body.move_strategy,
    state
  })
  const result = await dispatch(
    apiSliceWithDocuments.endpoints.movePages.initiate(inputArgs.movePagesData)
  )

  if ("error" in result) {
    throw result.error
  }

  if (!result.data) {
    throw "No data"
  }

  let {source, target} = result.data
  let lastVersionSource = getLastVersion(source?.versions)
  let lastVersionTarget = getLastVersion(target.versions)

  let dstUpdates = []

  if (lastVersionSource) {
    const srcUpdates = lastVersionSource.pages.map(lastVerPage => {
      const oldPageID = sourcePageData[lastVerPage.number - 1]
      return {
        newPageID: lastVerPage.id,
        newPageNumber: lastVerPage.number,
        oldPageID: oldPageID,
        angle: 0,
        docVerID: lastVersionSource.id,
        docID: lastVersionSource.document_id
      }
    })
    dispatch(addImageObjects({updates: srcUpdates}))
    let ver = clientDVFromDV(lastVersionSource)
    dispatch(addClientDocVersion(ver))
    dispatch(
      currentDocVerUpdated({
        mode: inputArgs.sourceMode,
        docVerID: lastVersionSource.id
      })
    )
    const docSliceEntity: DocSliceEntity = {
      id: lastVersionSource.document_id,
      latestDocVer: {
        docVerID: lastVersionSource.id,
        number: lastVersionSource.number
      }
    }
    dispatch(upsertDoc(docSliceEntity))
    dispatch(
      apiSliceWithDocuments.util.invalidateTags([
        {type: "DocVersList", id: lastVersionSource.document_id}
      ])
    )
    notifications.show({
      withBorder: true,
      message: t("documentVersion.was-created", {
        versionNumber: lastVersionSource.number
      }),
      autoClose: 4000
    })
  }
})

function getLastVersion(
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

function getSourceOrderedPageIDs({
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

interface GetTargetOrderedPageIDs {
  docID: UUID
  movedInPageIDs: UUID[]
  strategy: TransferStrategyType
  state: RootState
}

function getTargetOrderedPageIDs({
  docID,
  movedInPageIDs,
  strategy,
  state
}: GetTargetOrderedPageIDs): UUID[] {
  if (strategy == "replace") {
    return movedInPageIDs
  }

  const docVerID = state.docs.entities[docID]?.latestDocVer?.docVerID
  if (!docVerID) {
    console.error(`getTargetOrderedPageIDs: docVerID=${docVerID}} not found`)
    return []
  }

  const pages = state.docVers.entities[docVerID].pages
  if (!pages) {
    console.error(`getTargetOrderedPageIDs: empty pages`)
    return []
  }

  const pagesSortedByNumber = pages.slice().sort((a, b) => a.number - b.number)
  const origPageIDs = pagesSortedByNumber.map(p => p.id)
  const origPagesPlusMovedInPages = [...movedInPageIDs, ...origPageIDs]

  return origPagesPlusMovedInPages
}
