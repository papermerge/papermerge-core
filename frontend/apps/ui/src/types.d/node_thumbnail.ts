import { ImageStatus, UUID } from "./common"

export interface LoadThumbnailInputType {
  node_id: UUID
  status: ImageStatus | null
  url: string | null
}

export interface GenerateThumbnailInputType {
  node_id: UUID
  file: File
}
