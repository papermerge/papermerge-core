import {ImageStatus, UUID} from "./common"

export interface LoadThumbnailInputType {
  node_id: UUID
  status: ImageStatus | null
  url: string | null
}
