import type {UUID} from "@/types.d/common"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

type FilesAddedType = {
  nodeID: string
  objectURL: string
  fileName: string
  type: string
  size: number
}

export type FileItem = {
  nodeID: UUID
  fileName: string
  size: number
  type: string
  objectURL?: string
  docVerID?: UUID
}

export type FilesState = {
  files: Array<FileItem>
}

const initialState: FilesState = {
  files: []
}

export const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    filesAdded(state, action: PayloadAction<FilesAddedType>) {
      state.files = [...state.files, action.payload]
    }
  }
})

export default filesSlice.reducer
export const {filesAdded} = filesSlice.actions
