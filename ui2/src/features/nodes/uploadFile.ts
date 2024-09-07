import {createAsyncThunk} from "@reduxjs/toolkit"

import axios from "axios"
import type {FolderType, NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {uploaderFileItemUpdated} from "@/features/ui/uiSlice"

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

type UploadFileOutput = {
  source: NodeType | null
  target: FolderType
  file_name: string
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
      uploaderFileItemUpdated({
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
        uploaderFileItemUpdated({
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
        uploaderFileItemUpdated({
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
        uploaderFileItemUpdated({
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
