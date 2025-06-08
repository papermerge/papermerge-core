import {ImageStatus, UUID} from "./common"

export interface StatusForSize {
  status: ImageStatus | null
  url: string | null
  size: PageImageSize
}

export type PageImageSize = "sm" | "md" | "lg" | "xl"
export type PageImageDict = Record<UUID, Array<StatusForSize>>

export interface ProgressiveImageInputType {
  page_id: UUID
  docID: UUID
  docVerID: UUID
  previews: Array<StatusForSize>
}
