import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"

import axios from "axios"
import {RootState} from "@/app/types"
import type {FolderType, FileItemType, FileItemStatus, NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import type {UploadFileOutput} from "./types"

export type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
}

const initialState: UploaderState = {
  files: [],
  opened: false
}

type UpdateFileStatusArg = {
  item: {
    source: NodeType | null
    target: FolderType
    file_name: string
  }
  status: FileItemStatus
  error: string | null
}

const uploaderSlice = createSlice({
  name: "uploader",
  initialState,
  reducers: {
    closeUploader: state => {
      state.opened = false
      state.files = []
    },
    openUploader: state => {
      state.opened = true
    },
    updateFileItem: (state, action: PayloadAction<UpdateFileStatusArg>) => {
      const file_name = action.payload.item.file_name
      const target_id = action.payload.item.target.id
      const itemToAdd = {
        status: action.payload.status,
        error: action.payload.error,
        file_name: action.payload.item.file_name,
        source: action.payload.item.source,
        target: action.payload.item.target
      }

      const found = state.files.find(
        i => i.file_name == file_name && i.target.id == target_id
      )
      if (!found) {
        state.files.push(itemToAdd)
        state.opened = true
        return
      }

      const newItems = state.files.map(i => {
        if (i.file_name == file_name && i.target.id == target_id) {
          return itemToAdd
        } else {
          return i
        }
      })

      state.files = newItems
      state.opened = true
    }
  }
})

export default uploaderSlice.reducer
export const {openUploader, closeUploader, updateFileItem} =
  uploaderSlice.actions

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files

type UploadFileInput = {
  file: File
  refreshTarget: boolean
  target: FolderType
  skipOCR: boolean
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
    /** Uploading a file involves two steps:
     * 1. POST /api/nodes/ - create node database entry (without associated file)
     * 2. POST /api/documents/<id from previous step>/upload/
     */
    const baseUrl = getBaseURL() || "/"
    let defaultHeaders = getDefaultHeaders()
    const data1: CreateDocumentType = {
      title: args.file.name,
      parent_id: args.target.id,
      ctype: "document",
      ocr: !args.skipOCR
    }

    thunkApi.dispatch(
      updateFileItem({
        item: {
          source: null,
          target: args.target,
          file_name: args.file.name
        },
        status: "uploading",
        error: null
      })
    )

    const response1 = await axios.post(`${baseUrl}api/nodes/`, data1, {
      headers: defaultHeaders,
      validateStatus: () => true
    })

    if (response1.status >= 400) {
      thunkApi.dispatch(
        updateFileItem({
          item: {
            source: null,
            target: args.target,
            file_name: args.file.name
          },
          status: "failure",
          error: `${response1.status} ${response1.statusText}: ${response1.data?.detail}`
        })
      )
      return {
        file_name: args.file.name,
        source: null,
        target: args.target
      }
    }

    const createdNode = response1.data as NodeType

    const form_data = new FormData()

    form_data.append("file", args.file)

    defaultHeaders["Content-Type"] = "multipart/form-data"

    const response2 = await axios.post(
      `${baseUrl}api/documents/${createdNode.id}/upload`,
      form_data,
      {headers: defaultHeaders, validateStatus: () => true}
    )

    if (response2.status == 200 || response2.status == 201) {
      thunkApi.dispatch(
        updateFileItem({
          item: {
            source: createdNode,
            target: args.target,
            file_name: args.file.name
          },
          status: "success",
          error: null
        })
      )
    }
    if (response2.status >= 400) {
      thunkApi.dispatch(
        updateFileItem({
          item: {
            source: null,
            target: args.target,
            file_name: args.file.name
          },
          status: "failure",
          error: `${response2.status} ${response2.statusText} ${response2.data?.detail}`
        })
      )
      return {
        file_name: args.file.name,
        source: null,
        target: args.target
      }
    }

    return {
      file_name: args.file.name,
      source: createdNode,
      target: args.target
    }
  }
)
