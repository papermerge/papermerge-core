import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"

import axios from "axios"
import {RootState} from "@/app/types"
import type {FolderType, FileItemType, NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"

export type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
}

const initialState: UploaderState = {
  files: [],
  opened: false
}

type NodeCreatedArg = {
  source: NodeType
  target: FolderType
  file: File
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
    },
    nodeCreated: (state, action: PayloadAction<NodeCreatedArg>) => {
      // mark uploader file item as "uploading"
      state.opened = true
      state.files.push({
        status: "uploading",
        error: null,
        file: action.payload.file,
        source: action.payload.source,
        target: action.payload.target
      })
    }
  },
  extraReducers(builder) {
    builder.addCase(uploadFile.pending, (state, {payload}) => {})
    builder.addCase(uploadFile.fulfilled, (state, {payload}) => {})
    builder.addCase(uploadFile.rejected, (state, {payload}) => {})
  }
})

export default uploaderSlice.reducer
export const {openUploader, closeUploader, nodeCreated} = uploaderSlice.actions

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files

type UploadFileInput = {
  file: File
  refreshTarget: boolean
  target: FolderType
  skipOCR: boolean
}

type UploadFileOutput = {
  source: NodeType
  target: FolderType
  file: File
}

type CreateDocumentType = {
  title: string
  parent_id: string
  ctype: "document"
  ocr: boolean
}

export const uploadFile = createAsyncThunk<UploadFileOutput, UploadFileInput>(
  "upload/file",
  async (args: UploadFileInput, thunkApi) => {
    const baseUrl = getBaseURL()
    let defaultHeaders = getDefaultHeaders()
    const data1: CreateDocumentType = {
      title: args.file.name,
      parent_id: args.target.id,
      ctype: "document",
      ocr: !args.skipOCR
    }

    const response1 = await axios.post(`${baseUrl}api/nodes/`, data1, {
      headers: defaultHeaders
    })
    const createdNode = response1.data as NodeType
    const form_data = new FormData()

    form_data.append("file", args.file)

    thunkApi.dispatch(
      nodeCreated({
        source: createdNode,
        target: args.target,
        file: args.file
      })
    )

    defaultHeaders["Content-Type"] = "multipart/form-data"

    const response2 = await axios.post(
      `${baseUrl}api/documents/${createdNode.id}/upload`,
      form_data,
      {headers: defaultHeaders}
    )

    return {
      file: args.file,
      source: createdNode,
      target: args.target
    }
  }
)
