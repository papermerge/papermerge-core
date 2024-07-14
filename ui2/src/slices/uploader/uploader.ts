import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import type {FolderType} from "@/types"

export type FileItemType = {
  status: "pending" | "uploading" | "success" | "failure"
  error: string | null
  name: string
  target: string
}

export type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
}

const initialState: UploaderState = {
  files: [
    {status: "pending", error: null, name: "coco.pdf", target: "home"},
    {status: "pending", error: null, name: "coco.pdf", target: "home"},
    {status: "pending", error: null, name: "coco.pdf", target: "home"}
  ],
  opened: true
}

const uploaderSlice = createSlice({
  name: "uploader",
  initialState,
  reducers: {
    closeUploader: state => {
      state.opened = false
    },
    openUploader: state => {
      state.opened = true
    }
  },
  extraReducers(builder) {}
})

export default uploaderSlice.reducer
export const {openUploader, closeUploader} = uploaderSlice.actions

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files
