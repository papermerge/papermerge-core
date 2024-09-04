import {apiSliceWithNodes} from "./apiSlice"

export const selectFolderResult = (folderID: string) =>
  apiSliceWithNodes.endpoints.getFolder.select(folderID)
