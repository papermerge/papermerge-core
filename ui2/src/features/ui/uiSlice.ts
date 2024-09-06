import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {RootState} from "@/app/types"

import type {FolderType, FileItemType, FileItemStatus, NodeType} from "@/types"

type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
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

interface UIState {
  uploader: UploaderState
}

const initialState: UIState = {
  uploader: {
    opened: false,
    files: []
  }
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    closeUploader: state => {
      state.uploader.opened = false
      state.uploader.files = []
    },
    openUploader: state => {
      state.uploader.opened = true
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

      const found = state.uploader.files.find(
        i => i.file_name == file_name && i.target.id == target_id
      )
      if (!found) {
        state.uploader.files.push(itemToAdd)
        state.uploader.opened = true
        return
      }

      const newItems = state.uploader.files.map(i => {
        if (i.file_name == file_name && i.target.id == target_id) {
          return itemToAdd
        } else {
          return i
        }
      })

      state.uploader.files = newItems
      state.uploader.opened = true
    }
  }
})
export const {openUploader, closeUploader, updateFileItem} = uiSlice.actions
export default uiSlice.reducer

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files
