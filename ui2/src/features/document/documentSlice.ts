import {RootState} from "@/app/types"
import {PayloadAction, createSlice} from "@reduxjs/toolkit"

interface PageMemory {
  data: string
  angle: number
}

interface DocumentEntity {
  pages: Record<number, PageMemory>
}

interface DocumentState {
  docs: Record<string, DocumentEntity>
}

const initialState: DocumentState = {
  docs: {}
}

interface PageAddedArg {
  documentID: string
  pageNumber: number
  angle: number
  data: string
}

const documentSlice = createSlice({
  name: "doc",
  initialState,
  reducers: {
    pageAdded(state, action: PayloadAction<PageAddedArg>) {
      const {documentID, pageNumber, data, angle} = action.payload
      if (state.docs[documentID]) {
        state.docs[documentID].pages[pageNumber] = {
          data: data,
          angle: angle
        }
      } else {
        state.docs[documentID] = {
          pages: {}
        }
        state.docs[documentID].pages[pageNumber] = {
          data,
          angle
        }
      }
    }
  }
})

export default documentSlice.reducer

export const {pageAdded} = documentSlice.actions

export const selectPageMemoryData = (
  state: RootState,
  documentID: string,
  number: number
) => {
  if (state.doc.docs[documentID]) {
    return state.doc.docs[documentID].pages[number]
  }
}
