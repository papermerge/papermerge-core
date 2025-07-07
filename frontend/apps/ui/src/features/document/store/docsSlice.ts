import {RootState} from "@/app/types"
import {UUID} from "@/types.d/common"
import {createEntityAdapter, createSlice, PayloadAction} from "@reduxjs/toolkit"

export type LatestDocVer = {
  docVerID: UUID
  number: number
}

export type DocSliceEntity = {
  id: UUID // DocumentID
  latestDocVer: LatestDocVer
}

export const docsAdapter = createEntityAdapter<DocSliceEntity>()
const initialState = docsAdapter.getInitialState()

/**
 * This slice is used for convenient store of the info about
 * what is the latest version of particular document
 */
const docsSlice = createSlice({
  name: "docs",
  initialState,
  reducers: {
    // Insert or update a single doc
    upsertDoc: (state, action: PayloadAction<DocSliceEntity>) => {
      docsAdapter.upsertOne(state, action.payload)
    },
    // Insert or update multiple docs
    upsertDocs: (state, action: PayloadAction<DocSliceEntity[]>) => {
      docsAdapter.upsertMany(state, action.payload)
    },

    // Remove a doc
    removeDoc: (state, action: PayloadAction<UUID>) => {
      docsAdapter.removeOne(state, action.payload)
    }
  }
})

export default docsSlice.reducer
export const {upsertDoc, upsertDocs, removeDoc} = docsSlice.actions

export const docsSelectors = docsAdapter.getSelectors<{
  posts: typeof initialState
}>(state => state.posts)

export const {selectById} = docsSelectors

export const selectLatestDocVerByDocID = (state: RootState, docID?: UUID) => {
  if (!docID) {
    return undefined
  }

  const doc = state.docs.entities[docID]
  if (doc) {
    return doc.latestDocVer.docVerID
  }

  return undefined
}
